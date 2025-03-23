import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { MessageSquarePlus } from 'lucide-react';
import ChatDisplay, { ChatMessage } from './ChatDisplay';
import ChatInput from './ChatInput';

interface TripDiscussionProps {
  tripId: string;
  isCreator?: boolean;
  isApproved?: boolean;
}

// Context for managing chat state
const TripDiscussion: React.FC<TripDiscussionProps> = ({ 
  tripId, 
  isCreator = false,
  isApproved = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const mounted = useRef(true);
  // Track active subscription
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Track processed message IDs to prevent duplicates
  const processedMsgIds = useRef<Set<string>>(new Set());
  // Debug logging helper
  const debugLog = useRef((message: string, data?: any) => {
    if (data) {
      console.log(`[TripDiscussion] ${message}:`, data);
    } else {
      console.log(`[TripDiscussion] ${message}`);
    }
  }).current;

  // Fetch all messages for a chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!chatId) {
      debugLog('Cannot fetch messages: No chat ID');
      return [];
    }
    
    try {
      debugLog(`Fetching messages for chat ${chatId}`);
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        debugLog('No messages found');
        return [];
      }
      
      debugLog(`Found ${data.length} messages`);
      
      // Extract unique user IDs
      const userIds = [...new Set(data.map(msg => msg.user_id))];
      
      // Fetch user data for all messages in a single query
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, username, profile_image')
        .in('id', userIds);
      
      if (userError) {
        throw userError;
      }
      
      // Create a map of user data for quick lookup
      const userMap = (userData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      // Format messages with user data
      const messagesWithUsers = data.map(msg => ({
        ...msg,
        user: {
          name: userMap[msg.user_id]?.name || 'Unknown User',
          username: userMap[msg.user_id]?.username || 'unknown',
          profile_image: userMap[msg.user_id]?.profile_image || null
        }
      }));
      
      return messagesWithUsers;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }, []);

  // Set up realtime subscription for new messages
  const setupSubscription = useCallback((chatId: string) => {
    if (!chatId || !user) {
      debugLog('Cannot setup subscription: Missing chat ID or user');
      return;
    }
    
    // Clean up existing subscription if any
    if (subscriptionRef.current) {
      debugLog('Removing existing subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    debugLog(`Setting up subscription for chat ${chatId}`);
    
    const channel = supabase.channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          debugLog('New message received from subscription', payload);
          const newMessage = payload.new as any;
          
          // Skip if we've already processed this message
          if (processedMsgIds.current.has(newMessage.id)) {
            debugLog(`Skipping already processed message ${newMessage.id}`);
            return;
          }
          
          processedMsgIds.current.add(newMessage.id);
          
          try {
            // Fetch user data for the message
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, name, username, profile_image')
              .eq('id', newMessage.user_id)
              .single();
            
            if (userError) throw userError;
            
            // Only update state if component is still mounted
            if (mounted.current) {
              setMessages(prev => [
                ...prev,
                {
                  ...newMessage,
                  user: {
                    name: userData?.name || 'Unknown User',
                    username: userData?.username || 'unknown',
                    profile_image: userData?.profile_image || null
                  },
                  isNew: true
                }
              ]);
            }
          } catch (error) {
            console.error('Error processing new message:', error);
          }
        }
      )
      .subscribe((status) => {
        debugLog(`Subscription status: ${status}`);
        
        // If subscription failed, try again after a delay
        if (status !== 'SUBSCRIBED' && mounted.current) {
          debugLog('Subscription failed, will retry');
          setTimeout(() => {
            if (mounted.current) {
              setupSubscription(chatId);
            }
          }, 3000);
        }
      });
    
    subscriptionRef.current = channel;
    
    // Return cleanup function
    return () => {
      debugLog('Unsubscribing from chat');
      channel.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [user]);

  // Initialize the chat (find existing or create new)
  const initializeChat = useCallback(async () => {
    if (!tripId || !user) {
      debugLog('Cannot initialize chat: Missing trip ID or user');
      setIsLoading(false);
      return;
    }
    
    try {
      debugLog(`Initializing chat for trip ${tripId}`);
      setIsLoading(true);
      setError(null);
      
      // Check if a chat already exists for this trip
      const { data: existingChat, error: chatError } = await supabase
        .from('trip_chats')
        .select('id')
        .eq('trip_id', tripId)
        .single();
      
      let currentChatId;
      
      if (chatError) {
        if (chatError.code === 'PGRST116') {
          // No chat found, create a new one if user is approved or the creator
          if (isCreator || isApproved) {
            debugLog('No chat found, creating new chat');
            const { data: newChat, error: createError } = await supabase
              .from('trip_chats')
              .insert({ trip_id: tripId })
              .select()
              .single();
            
            if (createError) throw createError;
            
            currentChatId = newChat.id;
            debugLog(`New chat created with ID ${currentChatId}`);
          } else {
            debugLog('User not approved to create chat');
            setError('You are not approved to participate in this chat');
            setIsLoading(false);
            return;
          }
        } else {
          throw chatError;
        }
      } else {
        currentChatId = existingChat.id;
        debugLog(`Found existing chat with ID ${currentChatId}`);
      }
      
      // Set the chat ID in state
      setChatId(currentChatId);
      
      // Fetch messages for this chat
      const messagesData = await fetchMessages(currentChatId);
      
      if (mounted.current) {
        setMessages(messagesData);
        
        // Set up subscription for new messages
        setupSubscription(currentChatId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load the discussion. Please try again.');
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [tripId, user, isCreator, isApproved, fetchMessages, setupSubscription]);

  // Initialize chat on component mount
  useEffect(() => {
    initializeChat();
    
    return () => {
      mounted.current = false;
      
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [initializeChat]);

  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    if (!message || !chatId || !user) {
      return;
    }
    
    try {
      setIsSending(true);
      
      // Create a temporary message ID to track this message
      const tempId = `temp-${Date.now()}`;
      processedMsgIds.current.add(tempId);
      
      const newMessage = {
        chat_id: chatId,
        user_id: user.id,
        message: message
      };
      
      const { data, error } = await supabase
        .from('trip_messages')
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the actual message ID to processed set to prevent duplication when subscription fires
      processedMsgIds.current.add(data.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Only render chat input if user is approved or the creator
  const canParticipate = isCreator || isApproved;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MessageSquarePlus className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isApproved ? 'Chat Error' : 'Access Restricted'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'You need to be approved to participate in this discussion'}
          </p>
          {!isApproved && !isCreator && (
            <p className="text-sm text-gray-400">
              Your request to join this trip must be approved first
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="h-[400px]">
            <ChatDisplay 
              messages={messages} 
              isLoading={isLoading} 
            />
          </div>
          
          {canParticipate && (
            <div className="border-t border-gray-200">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isSending}
                placeholder="Type your message..."
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripDiscussion; 