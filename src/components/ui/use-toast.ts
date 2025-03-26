// This file provides the useToast functionality without exporting a standalone toast function
// that can be used outside of React components

import { createContext, useContext } from 'react';

// Create a Toast context
type ToastContextType = {
  toast: (message: string, type?: 'info' | 'success' | 'error') => string;
  success: (message: string) => string;
  error: (message: string) => string;
  info: (message: string) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Internal toast function - only used within the hook
function createToast(context: ToastContextType) {
  return function(props: any) {
    try {
      // If props is a string, treat it as a message with default type
      if (typeof props === 'string') {
        return context.info(props);
      }
      
      // Handle different formats of toast parameters
      const type = props.variant === 'destructive' ? 'error' : 
                  props.variant === 'success' ? 'success' : 'info';
      
      const message = props.title || props.description || '';
      const id = context[type](message);
      
      // Return a compatible API for existing toast calls
      return { 
        id,
        dismiss: () => context.dismiss(id),
        update: () => {} // Noop function for compatibility
      };
    } catch (err) {
      console.error('Error in toast function:', err);
      // Fallback that doesn't crash
      return { 
        id: '0', 
        dismiss: () => {}, 
        update: () => {} 
      };
    }
  };
}

// The hook that components should use
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    console.warn('useToast was used outside ToastProvider');
    // Fallback implementation when used outside provider
    const noopToast = (message: string) => {
      console.log('Toast (fallback):', message);
      return '0';
    };
    
    return { 
      toast: createToast({
        toast: noopToast,
        success: noopToast,
        error: (message: string) => { console.error(message); return '0'; },
        info: noopToast,
        dismiss: () => {}
      }),
      toasts: [],
      dismiss: () => {},
      success: noopToast,
      error: (message: string) => { console.error(message); return '0'; },
      info: noopToast
    };
  }
  
  // Return the context with a toast function that has access to the context
  return {
    ...context,
    toasts: [],
    toast: createToast(context)
  };
}
