import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

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

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, user: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session when the component mounts
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Set up a listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // Create the user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            username: userData.username
          },
        },
      });
      
      if (authError) {
        if (authError.message?.includes('already registered')) {
          return { error: { message: 'Email is already registered' }, user: null };
        }
        return { error: authError, user: null };
      }
      
      if (!authData.user) {
        return { error: { message: 'No user data returned from auth signup' }, user: null };
      }

      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: userData.name,
            username: userData.username,
            email: email,
            profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            followers_count: 0,
            following_count: 0,
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