import { useEffect, useRef, useState } from "react";

interface UseAutoScrollOptions {
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll({
  smooth = false,
  content,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevContentRef = useRef<React.ReactNode>(content);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    // Consider 'at bottom' if within 100px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAtBottom(atBottom);
    
    // Re-enable auto scroll if user scrolls to bottom manually
    if (atBottom && !autoScrollEnabled) {
      setAutoScrollEnabled(true);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    if (smooth) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
    
    setIsAtBottom(true);
    setAutoScrollEnabled(true);
  };

  // Disable auto scroll when user scrolls up
  const disableAutoScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (!atBottom && autoScrollEnabled) {
      setAutoScrollEnabled(false);
    }
  };

  // Auto scroll to bottom when messages change (if enabled)
  useEffect(() => {
    // Only scroll if content changed
    if (prevContentRef.current !== content) {
      prevContentRef.current = content;
      
      if (autoScrollEnabled) {
        scrollToBottom();
      }
    }
  }, [content, autoScrollEnabled]);

  // Setup scroll event listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    const handleScroll = () => {
      checkIfAtBottom();
    };
    
    scrollElement.addEventListener("scroll", handleScroll);
    
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
  };
} 