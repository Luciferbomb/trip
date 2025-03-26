import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define variants for chat bubbles
const chatBubbleVariants = cva(
  "flex items-start gap-2 group w-full p-2 hover:bg-muted/50 transition-colors",
  {
    variants: {
      variant: {
        sent: "flex-row-reverse",
        received: "flex-row",
      },
    },
    defaultVariants: {
      variant: "received",
    },
  }
);

// Define variants for message bubbles
const chatBubbleMessageVariants = cva(
  "rounded-lg px-4 py-2.5 text-sm break-words max-w-[85%] relative shadow-sm",
  {
    variants: {
      variant: {
        sent: "bg-primary text-primary-foreground rounded-tr-none",
        received: "bg-muted text-muted-foreground rounded-tl-none",
      },
    },
    defaultVariants: {
      variant: "received",
    },
  }
);

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof chatBubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(chatBubbleVariants({ variant }), className)}
      {...props}
    />
  )
);
ChatBubble.displayName = "ChatBubble";

interface ChatBubbleAvatarProps extends React.ComponentProps<typeof Avatar> {
  src?: string;
  fallback: string;
}

const ChatBubbleAvatar = ({
  className,
  src,
  fallback,
  ...props
}: ChatBubbleAvatarProps) => (
  <Avatar 
    className={cn(
      "h-8 w-8 border-2 border-background bg-muted flex-shrink-0",
      "ring-2 ring-background",
      className
    )} 
    {...props}
  >
    {src ? <AvatarImage src={src} alt={fallback} /> : null}
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);
ChatBubbleAvatar.displayName = "ChatBubbleAvatar";

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ className, variant, isLoading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          chatBubbleMessageVariants({ variant }),
          isLoading ? "min-w-[80px] flex items-center justify-center" : "",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex gap-1 py-1 justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-[pulse_1s_ease-in-out_0s_infinite]"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-[pulse_1s_ease-in-out_0.2s_infinite]"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-[pulse_1s_ease-in-out_0.4s_infinite]"></span>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);
ChatBubbleMessage.displayName = "ChatBubbleMessage";

export { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage }; 