import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://lvkxugoytdpyjqpkfmdr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3h1Z295dGRweWpxcGtmbWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjg1NDAsImV4cCI6MjA1NzgwNDU0MH0.iW3VaOeV85gI3izkdV2br-R4otuDpy64sDlt5Q6pCrw';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3h1Z295dGRweWpxcGtmbWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyODU0MCwiZXhwIjoyMDU3ODA0NTQwfQ.NRVb0fIj3LP7Ej9c-zvyF6EoEzvFhM00kSYwRrFonMI';

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: globalThis?.localStorage,
    storageKey: 'supabase-auth-token'
  }
});

// Create a regular Supabase client for normal user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: globalThis?.localStorage,
    storageKey: 'supabase-auth-token'
  }
});

// Configure email confirmation URL
export const getEmailRedirectUrl = () => {
  // Use the deployed site URL if available, fallback to current origin
  const baseUrl = 
    process.env.NODE_ENV === 'production' 
      ? 'https://hireyth.netlify.app' 
      : window.location.origin;
  
  return `${baseUrl}/email-confirmation`;
};

// Helper function to resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  try {
    console.log('Attempting to resend confirmation email to:', email);
    console.log('Redirect URL:', getEmailRedirectUrl());
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
      }
    });
    
    if (error) {
      console.error('Error from Supabase resend:', error);
    } else {
      console.log('Confirmation email resend successful');
    }
    
    return { error };
  } catch (err) {
    console.error('Exception when resending confirmation email:', err);
    return { error: err };
  }
};

// Configure auth state change listener for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event}`, session);
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
    console.log('User metadata:', session?.user?.user_metadata);
  } else if (event === 'USER_UPDATED') {
    console.log('User updated:', session?.user?.email);
    console.log('Email confirmed at:', session?.user?.email_confirmed_at);
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('Password recovery initiated');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

export default supabase; 