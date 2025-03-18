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

export default supabase; 