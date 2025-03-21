import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getEmailRedirectUrl } from './supabase';

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
      setLoading(true);
      
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: getEmailRedirectUrl()
        }
      });
      
      if (authError) {
        return { error: authError, user: null };
      }
      
      if (!authData.user) {
        return { error: { message: 'No user data returned from auth signup' }, user: null };
      }
      
      try {
        // Create the user profile in the database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            username: email.split('@')[0], // Generate username from email as default
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_completed: false
          })
          .select()
          .single();

        if (profileError) {
          // If profile creation fails, clean up the auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          if (profileError.message?.includes('duplicate key')) {
            if (profileError.message.includes('users_email_key')) {
              return { error: { message: 'Email is already registered' }, user: null };
            }
            if (profileError.message.includes('users_username_key')) {
              return { error: { message: 'Username is already taken' }, user: null };
            }
          }
          return { error: profileError, user: null };
        }

        // Create storage bucket for user if it doesn't exist
        const { error: storageError } = await supabase
          .storage
          .createBucket(`user-${authData.user.id}`, {
            public: false,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
          });

        if (storageError && !storageError.message.includes('already exists')) {
          console.error('Error creating user storage bucket:', storageError);
        }

        return { error: null, user: authData.user };
      } catch (error: any) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        error: { 
          message: error.message?.includes('duplicate key') 
            ? 'Username or email already exists' 
            : error.message || 'An unexpected error occurred'
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