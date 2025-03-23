import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { format, parseISO, isValid } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  user: {
    name: string;
    username?: string;
    profile_image?: string;
  };
  isNew?: boolean;
}

interface ChatDisplayProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

// Memoize the ChatDisplay component to prevent unnecessary re-renders
const ChatDisplay: React.FC<ChatDisplayProps> = memo(({ 
  messages, 
  isLoading = false,
  className = '' 
}) => {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Track new messages and remove the "new" status after 2 seconds
  // Using useCallback for better performance
  const handleNewMessage = useCallback(() => {
    const newMessages = messages.filter(msg => 
      msg.isNew && 
      !newMessageIds.has(msg.id) && 
      !processedMessagesRef.current.has(msg.id)
    );
    
    if (newMessages.length > 0) {
      // Add to processed ref to avoid reprocessing
      newMessages.forEach(msg => {
        processedMessagesRef.current.add(msg.id);
      });
      
      // Add the new message IDs to our Set
      const newIds = new Set(newMessageIds);
      newMessages.forEach(msg => newIds.add(msg.id));
      setNewMessageIds(newIds);
      
      // Remove the "new" status after 2 seconds
      newMessages.forEach(msg => {
        setTimeout(() => {
          setNewMessageIds(prev => {
            const updated = new Set(prev);
            updated.delete(msg.id);
            return updated;
          });
        }, 2000);
      });
    }
  }, [messages, newMessageIds]);

  // Process new messages when they arrive
  useEffect(() => {
    handleNewMessage();
  }, [handleNewMessage]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Helper function to safely format dates
  const safeFormatDate = useCallback((dateString: string, formatStr: string): string => {
    try {
      let date: Date;
      
      // First try to parse as ISO string which is more reliable
      try {
        date = parseISO(dateString);
        if (!isValid(date)) throw new Error('Invalid ISO date');
      } catch {
        // Fall back to the regular Date constructor
        date = new Date(dateString);
        if (!isValid(date) || isNaN(date.getTime())) {
          return 'Invalid date';
        }
      }
      
      return format(date, formatStr);
    } catch (error) {
      console.error("Error formatting date:", error, "for string:", dateString);
      return 'Unknown date';
    }
  }, []);

  // Generate consistent user color based on username
  const getUserGradient = useCallback((username: string = ''): string => {
    // Simple hash function for username
    const hash = Array.from(username || 'user').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    );
    
    // Predefined gradients for visual consistency
    const gradients = [
      'from-blue-500 to-indigo-600', // blue
      'from-green-500 to-emerald-600', // green
      'from-pink-500 to-rose-600', // pink
      'from-purple-500 to-violet-600', // purple
      'from-amber-500 to-orange-600', // orange
      'from-teal-500 to-cyan-600', // teal
    ];
    
    return gradients[hash % gradients.length];
  }, []);

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div 
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="loader w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8">
            <div className="bg-gray-100 rounded-full p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Calculate if we should show the date divider
              const showDate = index === 0 || (
                safeFormatDate(messages[index-1].created_at, 'yyyy-MM-dd') !==
                safeFormatDate(message.created_at, 'yyyy-MM-dd')
              );
              
              const isCurrentUser = user?.id === message.user_id;
              const isNew = newMessageIds.has(message.id);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                        {safeFormatDate(message.created_at, 'MMMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex items-start gap-3 transition-all duration-300",
                    isCurrentUser ? "flex-row-reverse" : "",
                    isNew ? "animate-fade-in-up" : ""
                  )}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.user.profile_image || undefined} alt={message.user.name} />
                        <AvatarFallback className={cn(
                          "bg-gradient-to-br text-white text-xs font-semibold",
                          getUserGradient(message.user.username)
                        )}>
                          {message.user.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "flex flex-col",
                      isCurrentUser ? "items-end" : "items-start",
                      "max-w-[75%] md:max-w-[80%]"
                    )}>
                      {!isCurrentUser && (
                        <span className="text-xs text-gray-500 mb-1 ml-1">{message.user.name}</span>
                      )}
                      
                      <div className={cn(
                        "px-4 py-2 rounded-2xl break-words",
                        isCurrentUser 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                      )}>
                        {message.message}
                      </div>
                      
                      <span className="text-xs text-gray-400 mt-1 mx-1">
                        {safeFormatDate(message.created_at, 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={endRef} />
          </>
        )}
      </div>
    </div>
  );
});

ChatDisplay.displayName = 'ChatDisplay';

export default ChatDisplay; 