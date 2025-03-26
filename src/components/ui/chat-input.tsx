import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    // Internal state to manage the textarea value
    const [value, setValue] = React.useState("");
    
    // Create a ref if one isn't provided
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const resolvedRef = (ref || textareaRef) as React.RefObject<HTMLTextAreaElement>;
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        
        if (value.trim() && onValueChange) {
          onValueChange(value.trim());
          setValue("");
          
          // Reset height after clearing
          if (resolvedRef.current) {
            resolvedRef.current.style.height = "auto";
          }
        }
      }
    };
    
    // Auto-resize the textarea as the user types
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      
      // Reset the height first to properly calculate the scrollHeight
      textarea.style.height = "auto";
      
      // Set the height to the scrollHeight to fit the content
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    
    // Handle changes to the input value
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    return (
      <Textarea
        ref={resolvedRef}
        value={value}
        onChange={handleChange}
        rows={1}
        className={cn(
          "resize-none min-h-[40px] max-h-[200px] py-3 px-4 overflow-y-auto",
          className
        )}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
ChatInput.displayName = "ChatInput";

export { ChatInput }; 