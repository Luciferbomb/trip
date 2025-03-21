import { useContext } from 'react';
import { createContext } from 'react';

// Create a Toast context
type ToastContextType = {
  toast: (message: string, type?: 'info' | 'success' | 'error') => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

function toast(props: any) {
  const context = useContext(ToastContext);
  
  if (!context) {
    console.warn('toast was called outside ToastProvider');
    return { id: '0', dismiss: () => {}, update: () => {} };
  }
  
  const type = props.variant === 'destructive' ? 'error' : 
               props.variant === 'success' ? 'success' : 'info';
  
  const message = props.title || props.description || '';
  context.toast(message, type);
  
  // Return a compatible API for existing toast calls
  return { 
    id: Date.now().toString(),
    dismiss: () => {},
    update: () => {}
  };
}

function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    console.warn('useToast was used outside ToastProvider');
    return { 
      toast, 
      toasts: [],
      dismiss: () => {},
      success: (message: string) => console.log(message),
      error: (message: string) => console.error(message),
      info: (message: string) => console.log(message)
    };
  }
  
  return {
    ...context,
    toasts: [],
    toast
  };
}

export { useToast, toast };
