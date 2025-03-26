import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { MessageSquarePlus, PaperclipIcon, UserCheck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { ChatInput } from '@/components/ui/chat-input';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat-bubble';
import { getUserTripStatus, cleanupDuplicateChats, sendChatMessage, ensureChatAccess } from '@/lib/dbFunctions';
import { runChatTest } from '@/lib/chat-db-test';
import { createTripChatsTable, createTripMessagesTable } from '@/lib/migrations';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatData {
  id: string;
  trip_id: string;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    username?: string;
    profile_image?: string;
  };
  isNew?: boolean;
}

interface TripDiscussionProps {
  tripId: string;
  isCreator?: boolean;
  isApproved?: boolean;
}

// Add MessagePayload type definition
interface MessagePayload {
  new: {
    id: string;
    message: string;
    user_id: string;
    created_at: string;
    chat_id: string;
  };
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
  const [participantCount, setParticipantCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [canParticipate, setCanParticipate] = useState<boolean>(isCreator || isApproved);
  const [userApprovalStatus, setUserApprovalStatus] = useState<string | null>(null);
  const [chatExists, setChatExists] = useState<boolean>(false);
  const [chat, setChat] = useState<ChatData | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const mounted = useRef(true);
  // Track active subscription
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Track participants subscription
  const participantsSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Track processed message IDs to prevent duplicates
  const processedMsgIds = useRef<Set<string>>(new Set());
  // Debug flag for development environment
  const DEBUG_MODE = process.env.NODE_ENV === 'development';

  // Add error handling with retry limits and circuit breaker pattern
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState(false);
  const MAX_RETRIES = 3;

  // Add stable loading state management
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const previousMessages = useRef<ChatMessage[]>([]);

  // Add message container ref and scroll handling
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Add pagination and message batching
  const MESSAGES_PER_PAGE = 50;
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Add subscription state tracking
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRetryCount = useRef(0);
  const MAX_SUBSCRIPTION_RETRIES = 3;

  // Helper function for debug logging
  const debugLog = DEBUG_MODE 
    ? (...args: any[]) => console.log('📱 TripDiscussion:', ...args)
    : () => {};

  // Check user participation status to ensure proper access control
  const checkUserParticipationStatus = useCallback(async () => {
    if (!user || !tripId) return;
    
    try {
      // Get participation status from database
      const status = await getUserTripStatus(user.id, tripId);
      setUserApprovalStatus(status);
      
      // Update access based on status (creator always has access)
      const hasAccess = isCreator || status === 'approved';
      setCanParticipate(hasAccess);
      debugLog('User participation status:', { status, hasAccess });
      
      if (!hasAccess && status === 'pending') {
        setError('Your request to join this trip is pending approval');
      } else if (!hasAccess && status === 'rejected') {
        setError('Your request to join this trip was not approved');
      } else if (!hasAccess && !status) {
        setError('You need to join this trip to participate in discussions');
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Error checking participation status:', error);
    }
  }, [user, tripId, isCreator]);

  // Update debouncedSetMessages type
  const debouncedSetMessages = useCallback(
    (newMessagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      // Only update if there are actual changes
      setMessages(prev => {
        const newMessages = typeof newMessagesOrUpdater === 'function' 
          ? newMessagesOrUpdater(prev)
          : newMessagesOrUpdater;
        
        const hasChanges = JSON.stringify(prev) !== JSON.stringify(newMessages);
        return hasChanges ? newMessages : prev;
      });
    },
    []
  );

  // Add scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Update the initializeChat function with better error handling
  const initializeChat = useCallback(async (): Promise<ChatData | null> => {
    if (!tripId || !user?.id) {
      console.error('Cannot initialize chat: Missing tripId or user');
      setIsLoading(false);
      return null;
    }

    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries reached, stopping initialization attempts');
      setNetworkError(true);
      setIsLoading(false);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    try {
      console.log('Initializing chat for trip:', tripId);
      
      // Check if we have cached chat data
      const cachedChat = localStorage.getItem(`trip_chat_${tripId}`);
      if (cachedChat) {
        const parsedChat = JSON.parse(cachedChat);
        console.log('Using cached chat data:', parsedChat);
        setChat(parsedChat);
        setChatExists(true);
        setIsLoading(false);
        return parsedChat;
      }
      
      // Check if trip_chats table exists
      try {
        const { error: tableCheckError } = await supabase
          .from('trip_chats')
          .select('id')
          .limit(1);
        
        if (tableCheckError && tableCheckError.message.includes('does not exist')) {
          console.log('trip_chats table does not exist, creating tables...');
          try {
            await createTripChatsTable();
            await createTripMessagesTable();
            toast({
              title: "Chat tables created",
              description: "Chat functionality is now available.",
            });
          } catch (migrationError) {
            console.error('Error creating chat tables:', migrationError);
            toast({
              title: "Error creating chat tables",
              description: "Please try refreshing the page or contact support.",
              variant: "destructive"
            });
            setIsLoading(false);
            return null;
          }
        }
      } catch (e) {
        console.error('Error checking table existence:', e);
        // Continue anyway to try getting chat
      }

      // Try to get the existing chat first
      try {
        let { data: existingChat, error: chatError } = await supabase
          .from('trip_chats')
          .select('*')
          .eq('trip_id', tripId)
          .limit(1)
          .single();

        if (chatError) {
          if (!chatError.message.includes('No rows found')) {
            console.error('Error checking for existing chat:', chatError);
          }
          throw chatError;
        }

        if (existingChat) {
          console.log('Using existing chat:', existingChat);
          // Cache the chat data
          localStorage.setItem(`trip_chat_${tripId}`, JSON.stringify(existingChat));
          setChat(existingChat);
          setChatExists(true);
          setRetryCount(0); // Reset retry counter on success
          setIsLoading(false);
          return existingChat as ChatData;
        }
      } catch (error) {
        console.error('Could not fetch existing chat:', error);
        // Continue to create a new chat
      }

      // If no chat exists, create one
      try {
        console.log('No existing chat found, creating new chat room');
        const { data: newChat, error: createError } = await supabase
          .from('trip_chats')
          .insert({
            trip_id: tripId,
            created_by: user.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          toast({
            title: "Error creating chat",
            description: "There was a problem creating the chat room.",
            variant: "destructive"
          });
          
          setRetryCount(prev => prev + 1);
          setIsLoading(false);
          return null;
        }

        console.log('Created new chat:', newChat);
        // Cache the chat data
        localStorage.setItem(`trip_chat_${tripId}`, JSON.stringify(newChat));
        setChat(newChat);
        setChatExists(true);
        setRetryCount(0); // Reset retry counter on success
        setIsLoading(false);
        return newChat as ChatData;
      } catch (e) {
        console.error('Error creating new chat:', e);
        setRetryCount(prev => prev + 1);
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error in initializeChat:', error);
      toast({
        title: "Chat initialization failed",
        description: "There was a problem setting up the chat.",
        variant: "destructive"
      });
      setRetryCount(prev => prev + 1);
      setIsLoading(false);
      return null;
    }
  }, [tripId, user?.id, toast, retryCount]);

  // Update fetchMessages with pagination
  const fetchMessages = async (loadMore = false) => {
    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries reached, stopping fetch attempts');
      setNetworkError(true);
      setIsMessagesLoading(false);
      return;
    }

    try {
      if (!loadMore) {
        setIsMessagesLoading(true);
      } else {
        setIsFetchingMore(true);
      }
      
      if (!chat) {
        console.error("No chat found, can't fetch messages");
        setIsMessagesLoading(false);
        return;
      }

      // Use cached messages only for initial load
      if (!loadMore) {
        const cachedMessagesKey = `trip_messages_${chat.id}`;
        const cachedMessages = localStorage.getItem(cachedMessagesKey);
        if (cachedMessages) {
          const parsedMessages = JSON.parse(cachedMessages);
          console.log(`Using ${parsedMessages.length} cached messages`);
          setMessages(parsedMessages);
          previousMessages.current = parsedMessages;
          setLastMessageTimestamp(parsedMessages[0]?.created_at || null);
          setIsMessagesLoading(false);
          setIsInitialLoad(false);
          return;
        }
      }

      let query = supabase
        .from('trip_messages')
        .select(`
          id,
          message,
          user_id,
          created_at,
          user:users (
            id,
            name,
            username,
            profile_image
          )
        `)
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      // Add timestamp filter for pagination
      if (loadMore && lastMessageTimestamp) {
        query = query.lt('created_at', lastMessageTimestamp);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        // Keep previous messages on error
        setMessages(previousMessages.current);
        setError('Failed to load messages');
        setRetryCount(prev => prev + 1);
      } else {
        const formattedMessages: ChatMessage[] = (data || []).map((msg: any): ChatMessage => ({
          id: msg.id,
          message: msg.message,
          user_id: msg.user_id,
          created_at: msg.created_at,
          user: msg.user || {
            id: msg.user_id,
            name: 'Unknown User',
            username: 'unknown',
            profile_image: undefined
          }
        }));

        // Update hasMoreMessages based on received data
        setHasMoreMessages(formattedMessages.length === MESSAGES_PER_PAGE);
        
        if (loadMore) {
          // Append messages for pagination
          setMessages(prev => {
            const newMessages = [...prev, ...formattedMessages];
            // Remove duplicates
            const uniqueMessages = Array.from(
              new Map(newMessages.map(msg => [msg.id, msg])).values()
            );
            return uniqueMessages.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        } else {
          // Set initial messages
          setMessages(formattedMessages.reverse());
          // Cache only initial messages
          if (formattedMessages.length > 0) {
            localStorage.setItem(
              `trip_messages_${chat.id}`, 
              JSON.stringify(formattedMessages.reverse())
            );
          }
        }
        
        // Update last message timestamp for pagination
        if (formattedMessages.length > 0) {
          setLastMessageTimestamp(formattedMessages[formattedMessages.length - 1].created_at);
        }
        
        previousMessages.current = messages;
        setRetryCount(0); // Reset retry counter on success
      }
    } catch (err) {
      console.error('Unexpected error in fetchMessages:', err);
      // Keep previous messages on error
      setMessages(previousMessages.current);
      setError('Failed to load messages');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsMessagesLoading(false);
      setIsFetchingMore(false);
      setIsInitialLoad(false);
    }
  };

  // Add load more handler
  const handleLoadMore = useCallback(() => {
    if (!isFetchingMore && hasMoreMessages) {
      fetchMessages(true);
    }
  }, [isFetchingMore, hasMoreMessages]);

  // Add scroll handler to detect when user manually scrolls and check for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = Math.abs(
      target.scrollHeight - target.scrollTop - target.clientHeight
    ) < 50;
    setAutoScroll(isAtBottom);

    // Check if we should load more messages
    const isNearTop = target.scrollTop < 100;
    if (isNearTop && !isFetchingMore && hasMoreMessages) {
      handleLoadMore();
    }
  }, [isFetchingMore, hasMoreMessages, handleLoadMore]);

  // Effect to fetch messages when chat changes
  useEffect(() => {
    if (chat) {
      setIsLoading(true);
      fetchMessages()
        .finally(() => {
          setIsLoading(false);
          setChatExists(true);
        });
    }
  }, [chat, fetchMessages]);

  // First, define the cleanup function before it's used
  const cleanup = useCallback(() => {
    // Clean up subscriptions
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    if (participantsSubscriptionRef.current) {
      participantsSubscriptionRef.current.unsubscribe();
      participantsSubscriptionRef.current = null;
    }
  }, []);

  // Update setupSubscription with better error handling and reconnection logic
  const setupSubscription = useCallback((chatId: string) => {
    if (subscriptionRef.current) {
      debugLog('Cleaning up existing subscription');
      subscriptionRef.current.unsubscribe();
    }

    debugLog('Setting up new subscription for chat:', chatId);

    const createSubscription = () => {
      const subscription = supabase
        .channel(`chat:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_messages',
            filter: `chat_id=eq.${chatId}`
          },
          async (payload: MessagePayload) => {
            debugLog('Received new message:', payload.new.id);
            
            // Prevent duplicate messages
            if (processedMsgIds.current.has(payload.new.id)) {
              debugLog('Skipping duplicate message:', payload.new.id);
              return;
            }

            try {
              // Batch user data fetching
              const userIds = new Set([payload.new.user_id]);
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, username, profile_image')
                .in('id', Array.from(userIds))
                .single();

              if (userError) {
                debugLog('Error fetching user data:', userError);
                throw userError;
              }

              const newMessage: ChatMessage = {
                id: payload.new.id,
                message: payload.new.message,
                user_id: payload.new.user_id,
                created_at: payload.new.created_at,
                user: userData ? {
                  id: userData.id,
                  name: userData.name,
                  username: userData.username,
                  profile_image: userData.profile_image
                } : {
                  id: payload.new.user_id,
                  name: 'Unknown User',
                  username: 'unknown',
                  profile_image: undefined
                },
                isNew: true
              };

              if (mounted.current) {
                debugLog('Adding new message to state:', newMessage.id);
                debouncedSetMessages(prev => {
                  const messageExists = prev.some(msg => msg.id === newMessage.id);
                  if (messageExists) {
                    return prev;
                  }
                  const newMessages = [...prev, newMessage];
                  // Keep messages sorted by timestamp
                  return newMessages.sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                });
                processedMsgIds.current.add(newMessage.id);

                // Auto-scroll for new messages if we're already at the bottom
                if (autoScroll) {
                  scrollToBottom();
                }
              }
            } catch (error) {
              console.error('Error processing new message:', error);
              if (mounted.current) {
                toast({
                  title: "Error",
                  description: "Failed to process new message",
                  variant: "destructive"
                });
              }
            }
          }
        )
        .subscribe(status => {
          debugLog('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            debugLog('Successfully subscribed to chat messages');
            setIsSubscribed(true);
            subscriptionRetryCount.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            debugLog('Subscription error, will retry if attempts remain');
            setIsSubscribed(false);
            
            if (subscriptionRetryCount.current < MAX_SUBSCRIPTION_RETRIES) {
              const backoffTime = Math.min(1000 * Math.pow(2, subscriptionRetryCount.current), 10000);
              subscriptionRetryCount.current++;
              
              setTimeout(() => {
                if (mounted.current) {
                  debugLog(`Retrying subscription (attempt ${subscriptionRetryCount.current})`);
                  subscriptionRef.current = createSubscription();
                }
              }, backoffTime);
            } else {
              debugLog('Max subscription retries reached');
              toast({
                title: "Connection Error",
                description: "Unable to establish real-time connection. Messages may be delayed.",
                variant: "destructive"
              });
            }
          }
        });

      return subscription;
    };

    subscriptionRef.current = createSubscription();
  }, [supabase, toast, debugLog, mounted, debouncedSetMessages, autoScroll, scrollToBottom]);

  // Now define the setupParticipantSubscription function
  const setupParticipantSubscription = useCallback(() => {
    if (participantsSubscriptionRef.current) {
      participantsSubscriptionRef.current.unsubscribe();
    }
    
    const createParticipantSubscription = () => {
      return supabase
        .channel(`trip-participants-${tripId}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*', // Listen for all events: INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'trip_participants',
            filter: `trip_id=eq.${tripId}${user ? ` AND user_id=eq.${user.id}` : ''}`
          },
          (payload: any) => {
            debugLog('Participant status change detected:', payload);
            // Re-check participation status
            checkUserParticipationStatus();
            
            // If status changed to 'approved', refresh chat
            if (payload.new && payload.new.status === 'approved' && 
                (!payload.old || payload.old.status !== 'approved')) {
              // Restart the whole chat initialization process - but avoid circular dependency
              setError(null);
              initializeChat().then(chatData => {
                if (chatData?.id) {
                  setChatId(chatData.id);
                  fetchMessages();
                  setupSubscription(chatData.id);
                }
              });
              
              toast({
                title: "Access Granted",
                description: "You now have access to the chat",
              });
            }
          }
        )
        .subscribe(status => {
          debugLog('Participant subscription status:', status);
          
          // Handle reconnection if subscription fails
          if (status === 'CHANNEL_ERROR') {
            debugLog('Participant subscription error, will retry in 5 seconds');
            setTimeout(() => {
              if (mounted.current) {
                debugLog('Retrying participant subscription');
                participantsSubscriptionRef.current = createParticipantSubscription();
              }
            }, 5000);
          }
        });
    };
    
    participantsSubscriptionRef.current = createParticipantSubscription();
  }, [tripId, user, checkUserParticipationStatus, toast, debugLog, mounted, initializeChat, setupSubscription, setChatId, fetchMessages]);

  // Update the initializeOrRefreshChat function to handle network errors and retries better
  const initializeOrRefreshChat = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries reached in initializeOrRefreshChat');
      setNetworkError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // First check network connectivity before proceeding
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://www.google.com', { 
          mode: 'no-cors',
          cache: 'no-cache',
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Network connectivity check passed');
      } catch (e) {
        console.error('Network connectivity check failed:', e);
        setNetworkError(true);
        setIsLoading(false);
        return;
      }
      
      await checkUserParticipationStatus();
      
      const chat = await initializeChat();
      if (chat?.id) {
        setChatId(chat.id);
        await fetchMessages();
        setupSubscription(chat.id);
        setupParticipantSubscription();
        // Reset error state on success
        setError(null);
        setNetworkError(false);
        setRetryCount(0);
      } else {
        setIsLoading(false);
        // Only increment retry count if there was an actual error
        if (!networkError) {
          setRetryCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error initializing/refreshing chat:', error);
      setError('Failed to initialize chat');
      setIsLoading(false);
      setRetryCount(prev => prev + 1);
    }
  }, [checkUserParticipationStatus, initializeChat, fetchMessages, setupSubscription, setupParticipantSubscription, retryCount, networkError]);

  // Add an auto-retry mechanism with exponential backoff
  useEffect(() => {
    if (retryCount > 0 && retryCount < MAX_RETRIES && !networkError) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // Max 30 seconds
      console.log(`Auto-retry in ${backoffTime/1000} seconds (attempt ${retryCount} of ${MAX_RETRIES})`);
      
      const timeoutId = setTimeout(() => {
        if (mounted.current) {
          console.log(`Auto-retrying connection (attempt ${retryCount} of ${MAX_RETRIES})`);
          initializeOrRefreshChat();
        }
      }, backoffTime);
      
      return () => clearTimeout(timeoutId);
    }
  }, [retryCount, networkError, initializeOrRefreshChat]);

  // Initialize chat on component mount
  useEffect(() => {
    initializeOrRefreshChat();
    
    return () => {
      mounted.current = false;
      cleanup();
    };
  }, [initializeOrRefreshChat, cleanup]);

  // Refetch whenever isApproved/isCreator props change
  useEffect(() => {
    debugLog('Props changed:', { isCreator, isApproved });
    setCanParticipate(isCreator || isApproved);
    
    // If access has been granted, reset error and refresh
    if (isCreator || isApproved) {
      setError(null);
      if (!chatId && !isLoading) {
        initializeOrRefreshChat();
      }
    }
  }, [isCreator, isApproved, chatId, isLoading, initializeOrRefreshChat]);

  // Update handleSendMessage with optimistic updates
  const handleSendMessage = async (message: string) => {
    if (!message || !chatId || !user) {
      debugLog('Invalid message data:', { message, chatId, userId: user?.id });
      toast({
        title: "Error",
        description: "Cannot send message - missing required data",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSending(true);
      debugLog('Sending message:', message);
      
      // Create a temporary message ID to track this message
      const tempId = `temp-${Date.now()}`;
      processedMsgIds.current.add(tempId);
      
      // Add the message locally first for immediate feedback
      const optimisticMessage: ChatMessage = {
        id: tempId,
        message: message.trim(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
          username: user.email?.split('@')[0] || 'user',
          profile_image: user.user_metadata?.avatar_url
        },
        isNew: true
      };
      
      // Use debounced update for optimistic message
      debouncedSetMessages(prev => [...prev, optimisticMessage]);
      
      // Send message using the improved function
      debugLog('Sending message via sendChatMessage');
      const result = await sendChatMessage(chatId, user.id, message.trim());
      
      if (!result.success) {
        debugLog('Error from sendChatMessage:', result.error);
        
        // Remove the optimistic message on error
        debouncedSetMessages(prev => prev.filter(msg => msg.id !== tempId));
        
        toast({
          title: "Error",
          description: result.error.message || "Failed to send message",
          variant: "destructive"
        });
        
        return;
      }
      
      debugLog('Message sent successfully:', result.messageId);
      
      // Add the actual message ID to processed set to prevent duplication
      if (result.messageId) {
        processedMsgIds.current.add(result.messageId);
        
        // Update the temporary message with the real ID
        debouncedSetMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id: result.messageId as string } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the optimistic message
      debouncedSetMessages(prev => prev.filter(msg => msg.id.toString().startsWith('temp-')));
      
      toast({
        title: "Error",
        description: "Unexpected error sending message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefreshChat = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      // Clean up any duplicate chat rooms first
      await cleanupDuplicateChats(tripId);
      await initializeOrRefreshChat();
    } catch (e) {
      console.error('Error refreshing chat:', e);
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [tripId, initializeOrRefreshChat]);

  const refreshChat = () => {
    handleRefreshChat();
  };
  
  const handleAttachFile = () => {
    // Implementation for file attachment would go here
    toast({
      title: "Feature coming soon",
      description: "File attachments will be available in a future update",
    });
  };

  // Add to the useEffect that depends on chat
  useEffect(() => {
    if (chat) {
      debugLog('Chat initialized successfully', {
        chatId: chat.id,
        tripId: chat.trip_id,
        created_at: chat.created_at
      });
      
      // Log available tables for debugging
      if (process.env.NODE_ENV === 'development') {
        supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching tables:', error);
            } else {
              console.log('Available tables:', data?.map(t => t.table_name));
            }
          });
      }
    }
  }, [chat]);

  // Update useEffect for message changes
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, autoScroll, scrollToBottom]);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[500px] flex flex-col">
      {networkError ? (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Network Error</h3>
          <p className="text-gray-500 mb-4">
            Unable to connect to the server. Please check your connection and try again.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setNetworkError(false);
              setRetryCount(0);
              initializeOrRefreshChat();
            }}
            className="mt-4 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
          <MessageSquarePlus className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isApproved ? 'Chat Error' : 'Access Restricted'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'You need to be approved to participate in this discussion'}
          </p>
          {userApprovalStatus === 'pending' && (
            <div className="flex items-center text-amber-600 bg-amber-50 p-2 rounded">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <p className="text-sm">Your request is pending approval</p>
            </div>
          )}
          {!isApproved && !isCreator && !userApprovalStatus && (
            <p className="text-sm text-gray-400">
              Join this trip to access the discussion
            </p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshChat}
            disabled={refreshing}
            className="mt-4 hover:bg-gray-100 transition-colors"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="p-4 border-b flex justify-between items-center bg-white/95 backdrop-blur-sm sticky top-0 z-10">
            <div>
              <h3 className="font-medium text-gray-900">Trip Discussion</h3>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {/* Example participant avatars - you can make this dynamic */}
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-medium">P1</div>
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-medium">P2</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </p>
                {!chatExists && (
                  <div className="flex items-center text-amber-600 ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs">Initializing chat...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (user?.id && tripId) {
                      toast({
                        title: "Running DB Test",
                        description: "Check console for results"
                      });
                      runChatTest(tripId, user.id);
                    } else {
                      toast({
                        title: "Error",
                        description: "Missing user ID or trip ID",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="h-8 px-2 text-xs hover:bg-gray-100 transition-colors"
                >
                  Test DB
                </Button>
              )}
              {!isSubscribed && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span className="text-xs">Connecting...</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshChat}
                disabled={refreshing}
                className="h-8 px-2 hover:bg-gray-100 transition-colors"
              >
                {refreshing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>

          <CardContent className="flex-1 overflow-hidden p-0">
            <div 
              ref={messageContainerRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto p-4 scroll-smooth space-y-4"
            >
              {isFetchingMore && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {isInitialLoad && isMessagesLoading ? (
                <div className="flex flex-col items-center justify-center h-40 p-4">
                  <Loader2 className="h-8 w-8 text-gray-300 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-center p-4">
                  <div className="max-w-xs">
                    <p className="text-gray-500 mb-2">No messages in this chat yet</p>
                    <p className="text-sm text-gray-400">Be the first to start the conversation!</p>
                  </div>
                </div>
              ) : (
                <ChatMessageList smooth>
                  {messages.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      variant={message.user_id === user?.id ? "sent" : "received"}
                      className={cn(
                        "transition-all duration-200",
                        message.isNew && "animate-fade-in-up"
                      )}
                    >
                      <ChatBubbleAvatar
                        src={message.user?.profile_image}
                        fallback={message.user?.name?.[0]?.toUpperCase() || '?'}
                        className="ring-2 ring-white"
                      />
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">
                            {message.user_id === user?.id ? "You" : message.user?.name || "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <ChatBubbleMessage
                          variant={message.user_id === user?.id ? "sent" : "received"}
                          className={cn(
                            "rounded-2xl shadow-sm",
                            message.user_id === user?.id 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {message.message}
                        </ChatBubbleMessage>
                      </div>
                    </ChatBubble>
                  ))}
                </ChatMessageList>
              )}
            </div>
          </CardContent>
          
          {canParticipate && (
            <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <form 
                className="relative rounded-2xl border bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200"
                onSubmit={(e) => {
                  e.preventDefault();
                  const inputElement = e.currentTarget.querySelector('textarea');
                  if (inputElement && inputElement.value.trim()) {
                    handleSendMessage(inputElement.value);
                    inputElement.value = '';
                  }
                }}
              >
                <div className="flex items-stretch gap-2 p-2">
                  <ChatInput
                    placeholder="Type your message..."
                    className="min-h-10 resize-none rounded-xl bg-transparent border-0 p-2 shadow-none focus-visible:ring-0 flex-1 placeholder:text-gray-400"
                    onValueChange={text => {
                      // Store draft message in component state if needed
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const target = e.target as HTMLTextAreaElement;
                        if (target.value.trim()) {
                          handleSendMessage(target.value);
                          target.value = '';
                        }
                      }
                    }}
                    disabled={isSending || !chatExists}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    className="px-4 self-end mb-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    disabled={isSending || !chatExists}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Send</span>
                    )}
                  </Button>
                </div>
                <div className="flex items-center pt-1 px-2 pb-2 justify-between">
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={handleAttachFile}
                      disabled={isSending || !chatExists}
                      className="h-8 w-8 hover:bg-gray-100 transition-colors"
                    >
                      <PaperclipIcon className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">Attach file</span>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {!chatExists ? (
                      <span className="text-amber-600">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Initializing chat...
                      </span>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripDiscussion; 