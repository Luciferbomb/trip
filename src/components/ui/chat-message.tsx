import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  id: string;
  content: string;
  timestamp: string | Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isCurrentUser: boolean;
  status?: "sent" | "delivered" | "read";
  className?: string;
}

export function ChatMessage({
  content,
  timestamp,
  sender,
  isCurrentUser,
  status = "sent",
  className,
}: ChatMessageProps) {
  const formattedTime = typeof timestamp === 'string' 
    ? format(new Date(timestamp), "h:mm a")
    : format(timestamp, "h:mm a");

  return (
    <div
      className={cn(
        "flex w-full",
        isCurrentUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className="flex items-end gap-2 max-w-[80%]">
        {!isCurrentUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={sender.avatar} alt={sender.name} />
            <AvatarFallback>
              {sender.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isCurrentUser
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none"
          )}
        >
          {!isCurrentUser && (
            <div className="font-medium text-xs text-gray-600 mb-1">
              {sender.name}
            </div>
          )}
          <div className="break-words">{content}</div>
          <div className="flex items-center justify-end gap-1 -mb-1 mt-1">
            <span className="text-[10px] opacity-70">
              {formattedTime}
            </span>
            {isCurrentUser && (
              <CheckCheck
                className={cn(
                  "h-3 w-3",
                  status === "read"
                    ? "text-blue-400"
                    : "text-gray-400"
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 