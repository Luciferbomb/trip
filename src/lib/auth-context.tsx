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
      // First check if email is already registered
      const { data: existingEmailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (existingEmailUser) {
        return { 
          error: new Error('Email is already registered'), 
          user: null 
        };
      }
      
      // Check if username is taken
      const { data: existingUsernameUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', userData.username)
        .single();
        
      if (existingUsernameUser) {
        return { 
          error: new Error('Username is already taken'), 
          user: null 
        };
      }
      
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            username: userData.username
          },
        },
      });
      
      if (error) {
        return { error, user: null };
      }
      
      if (!data.user) {
        return { error: new Error('No user data returned from auth signup'), user: null };
      }

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
        
      if (existingProfile) {
        // Profile already exists, just return the user
        return { error: null, user: data.user };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: userData.name,
          username: userData.username,
          email: email,
          profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          followers_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          onboarding_completed: false
        });

      if (profileError) {
        // If profile creation fails, clean up the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        return { error: profileError, user: null };
      }

      // Create initial notification
      await supabase
        .from('notifications')
        .insert({
          user_id: data.user.id,
          type: 'welcome',
          message: 'Welcome to Hireyth! Complete your profile to get started.',
          created_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error creating welcome notification:', error);
            // Don't fail the signup for notification error
          }
        });

      return { error: null, user: data.user };
      
    } catch (error) {
      return { error, user: null };
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