import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://mbeifzjbssmilzzbgfhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 