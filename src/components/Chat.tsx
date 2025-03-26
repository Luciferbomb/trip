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
    <div className="flex flex-col h-[60vh] md:h-[500px] rounded-lg overflow-hidden border w-full max-w-full">
      {/* Chat header */}
      <div className="bg-white p-3 border-b shadow-sm flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src="" alt={tripName} />
            <AvatarFallback className="bg-blue-600 text-white">
              {tripName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{tripName}</h3>
            <p className="text-xs text-gray-500">
              {participants.length} participants
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-100 w-full overflow-x-hidden relative"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                timestamp={message.timestamp}
                sender={message.sender}
                isCurrentUser={message.sender.id === user?.id}
                status="read"
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-md z-10 flex items-center justify-center"
            aria-label="Scroll to bottom"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>
      
      {/* Message input */}
      <div className="bg-white p-3 border-t w-full">
        <div className="flex items-end gap-2 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full flex-shrink-0"
            type="button"
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="flex-1 resize-none max-h-32 min-h-10 rounded-full py-2.5 w-full"
            disabled={isSending}
          />
          
          <Button
            type="button"
            size="icon"
            className="rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 