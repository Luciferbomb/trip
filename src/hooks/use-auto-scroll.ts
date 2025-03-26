import { useRef, useState, useEffect } from "react";

interface UseAutoScrollOptions {
  smooth?: boolean;
  threshold?: number;
  content?: React.ReactNode;
}

export function useAutoScroll({
  smooth = false,
  threshold = 100,
  content,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // Check if the scroll is at the bottom
  const checkIfAtBottom = () => {
    const container = scrollRef.current;
    if (!container) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight <= threshold;
    
    setIsAtBottom(atBottom);
    return atBottom;
  };
  
  // Scroll to the bottom of the container
  const scrollToBottom = () => {
    const container = scrollRef.current;
    if (!container) return;
    
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
    
    setIsAtBottom(true);
    setAutoScrollEnabled(true);
  };
  
  // Handle scroll events
  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    if (atBottom && !autoScrollEnabled) {
      setAutoScrollEnabled(true);
    }
  };
  
  // Disable auto-scroll if the user manually scrolls up
  const disableAutoScroll = () => {
    if (isAtBottom) return;
    setAutoScrollEnabled(false);
  };
  
  // Enable auto-scroll
  const enableAutoScroll = () => {
    setAutoScrollEnabled(true);
    scrollToBottom();
  };
  
  // Auto-scroll to bottom when new content is added and auto-scroll is enabled
  useEffect(() => {
    if (autoScrollEnabled && scrollRef.current) {
      scrollToBottom();
    }
  }, [content, autoScrollEnabled]);
  
  // Attach scroll event listener to update state
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    container.addEventListener("scroll", handleScroll);
    
    // Initial check
    checkIfAtBottom();
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    enableAutoScroll,
    disableAutoScroll,
    checkIfAtBottom,
  };
} 