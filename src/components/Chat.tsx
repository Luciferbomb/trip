import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, PaperclipIcon, Smile, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ui/chat-message';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ensureChatAccess, sendChatMessage } from '@/lib/dbFunctions';

// Define the message type
interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface UserData {
  id?: string;
  name?: string;
  profile_image?: string;
}

interface ChatProps {
  tripId: string;
  tripName?: string;
}

const Chat: React.FC<ChatProps> = ({ tripId, tripName = "Trip Discussion" }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || !tripId) return;
      
      try {
        setIsLoading(true);
        
        // Ensure the chat exists
        const chatRoomId = await ensureChatAccess(tripId, user.id);
        
        if (!chatRoomId) {
          toast({
            title: "Chat Error",
            description: "Failed to create or access chat. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        setChatId(chatRoomId);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            users:user_id (id, name, profile_image)
          `)
          .eq('trip_id', tripId)
          .eq('status', 'approved');
          
        if (!participantsError && participantsData) {
          // Transform participants data to avoid type errors
          const transformedParticipants = participantsData.map(p => {
            // Cast or set default for users to handle possible null
            const userData = (p.users || {}) as UserData;
            return {
              id: userData.id || '',
              name: userData.name || 'Unknown',
              profile_image: userData.profile_image || ''
            };
          });
          
          setParticipants(transformedParticipants);
        }
        
        // Load existing messages
        await loadMessages(chatRoomId);
        
        // Set up real-time subscription
        const subscription = supabase
          .channel(`chat:${chatRoomId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'trip_messages',
            filter: `chat_id=eq.${chatRoomId}`
          }, payload => {
            handleNewMessage(payload.new);
          })
          .subscribe();
          
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Chat Error",
          description: "Failed to initialize chat. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [user, tripId]);
  
  // Load messages
  const loadMessages = async (chatRoomId: string) => {
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select(`
          id, 
          message,
          created_at,
          user_id,
          users:user_id (id, name, profile_image)
        `)
        .eq('chat_id', chatRoomId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const formattedMessages = data.map(msg => {
          // Handle possible null users data
          const userData = (msg.users || {}) as UserData;
          
          return {
            id: msg.id,
            content: msg.message,
            timestamp: msg.created_at,
            sender: {
              id: userData.id || 'unknown',
              name: userData.name || 'Unknown User',
              avatar: userData.profile_image || ''
            }
          };
        });
        
        setMessages(formattedMessages);
        
        // Force scroll to bottom when initial messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  // Handle new message from subscription
  const handleNewMessage = (newMsg: any) => {
    // If it's a message we sent, don't process again (to avoid duplicates)
    if (newMsg.user_id === user?.id && messages.some(m => m.id === newMsg.id)) {
      return;
    }
    
    // Fetch user info for the new message
    const fetchMessageDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, profile_image')
          .eq('id', newMsg.user_id)
          .single();
          
        if (error) throw error;
        
        if (!data) return;
        
        // Add the message to state
        const formattedMessage = {
          id: newMsg.id,
          content: newMsg.message,
          timestamp: newMsg.created_at,
          sender: {
            id: data.id,
            name: data.name,
            avatar: data.profile_image
          }
        };
        
        setMessages(prev => {
          // Check if this message is already in the list
          if (prev.some(msg => msg.id === formattedMessage.id)) {
            return prev;
          }
          return [...prev, formattedMessage];
        });
        
        // Force scroll to bottom for new messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (error) {
        console.error('Error fetching message details:', error);
      }
    };
    
    fetchMessageDetails();
  };
  
  // Send a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !user) return;
    
    try {
      setIsSending(true);
      
      // Add optimistic message immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        content: messageText.trim(),
        timestamp: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'You',
          avatar: user.user_metadata?.avatar_url || ''
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageText('');
      
      // Scroll to bottom immediately with the optimistic message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      
      const result = await sendChatMessage(chatId, user.id, messageText.trim());
      
      if (!result.success) {
        // Remove optimistic message if failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        
        toast({
          title: "Message Failed",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to manually scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Store scroll container ref
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if we're near the bottom to show/hide scroll button
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Add scroll event handler
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show button if more than 200px from bottom
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="flex flex-col h-[500px] bg-gray-50/50 rounded-lg">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.sender.id === user?.id ? 'flex-row-reverse' : ''
            }`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0 border border-gray-200">
              <AvatarImage src={message.sender.avatar} alt={message.sender.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                {message.sender.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div
              className={`flex flex-col ${
                message.sender.id === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {message.sender.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div
                className={`mt-1 px-4 py-2 rounded-2xl max-w-[80%] ${
                  message.sender.id === user?.id
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-gray-200 rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-gray-50/50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 