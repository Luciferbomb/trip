import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabase';

// Define the getEmailRedirectUrl function directly in this file
const getEmailRedirectUrl = () => {
  return `${window.location.origin}/email-confirmation`;
};

// Define the shape of the auth context
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from Supabase on mount
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { error };
      }
      
      setSession(data.session);
      setUser(data.user);
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign-in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // First check if user already exists via the admin API
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        console.log('User already exists with this email');
        return {
          error: {
            message: 'This email is already registered. Please sign in instead.'
          },
          user: null
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            onboarded: false,
          },
          emailRedirectTo: getEmailRedirectUrl(),
        },
      });

      if (error) {
        console.error('Signup error:', error.message);
        return { error, user: null };
      }

      // Check if the user already exists (signUp doesn't throw an error for existing users
      // but returns an empty user and a session)
      if (!data.user && data.session) {
        console.log('User exists but no error was thrown');
        return {
          error: {
            message: 'This email is already registered. Please sign in instead.'
          },
          user: null
        };
      }

      // Log success for debugging
      console.log('Signup successful. User ID:', data.user?.id);
      console.log('Confirmation email should be sent to:', email);
      console.log('Redirect URL configured as:', getEmailRedirectUrl());
      
      if (data.user) {
        // We won't insert into the users table here, as we'll do it after email confirmation
        return { error: null, user: data.user };
      } else {
        console.error('No user was created during signup');
        return {
          error: {
            message: 'Failed to create account. Please try again later.'
          },
          user: null
        };
      }
    } catch (err: any) {
      console.error('Unexpected error during signup:', err);
      return {
        error: {
          message: err.message || 'An unexpected error occurred during signup.'
        },
        user: null
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 