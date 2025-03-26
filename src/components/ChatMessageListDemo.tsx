"use client";

import React, { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";

// Demo message type
interface Message {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: Date;
}

// Demo users
const demoUsers = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://ui.shadcn.com/avatars/01.png"
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://ui.shadcn.com/avatars/02.png"
  },
  {
    id: "3",
    name: "Mike Johnson",
    avatar: "https://ui.shadcn.com/avatars/03.png"
  }
];

export function ChatMessageListDemo() {
  // State for messages and loading
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey everyone! Has anyone been to Paris recently? Looking for some travel tips!",
      user: demoUsers[0],
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: "2",
      content: "I was there last month! The Louvre is a must-visit, but try going early in the morning to avoid crowds.",
      user: demoUsers[1],
      timestamp: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      id: "3",
      content: "Don't forget to check out Montmartre! The view from Sacré-Cœur is amazing, especially at sunset.",
      user: demoUsers[2],
      timestamp: new Date(Date.now() - 1000 * 60 * 20)
    },
    {
      id: "4",
      content: "Thanks for the tips! Any restaurant recommendations?",
      user: demoUsers[0],
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Current user (for demo purposes)
  const currentUser = demoUsers[1];
  
  // Handle message submission
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // Add new message
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      user: currentUser,
      timestamp: new Date()
    };
    
    // Simulate network delay
    setTimeout(() => {
      setMessages((prev) => [...prev, newMessage]);
      setIsLoading(false);
    }, 500);
  };
  
  const handleAttachFile = () => {
    alert("File attachment feature coming soon!");
  };
  
  return (
    <div className="h-[500px] flex flex-col bg-background border rounded-lg overflow-hidden">
      <div className="p-3 border-b">
        <h3 className="font-medium">Paris Trip Discussion</h3>
        <p className="text-xs text-muted-foreground">4 participants</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatMessageList smooth className="h-full">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.user.id === currentUser.id ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                fallback={message.user.name[0]}
                src={message.user.avatar}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {message.user.id === currentUser.id ? "You" : message.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <ChatBubbleMessage
                  variant={message.user.id === currentUser.id ? "sent" : "received"}
                  className="animate-fade-in-up"
                >
                  {message.content}
                </ChatBubbleMessage>
              </div>
            </ChatBubble>
          ))}
          
          {isLoading && (
            <ChatBubble variant="sent">
              <ChatBubbleAvatar
                fallback={currentUser.name[0]}
                src={currentUser.avatar}
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>
      
      <div className="p-3 border-t bg-white">
        <form 
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <ChatInput
            placeholder="Type your message..."
            className="min-h-10 resize-none rounded-lg bg-background border-0 p-2 shadow-none focus-visible:ring-0"
            onValueChange={handleSendMessage}
            disabled={isLoading}
          />
          <div className="flex items-center p-2 pt-1 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 