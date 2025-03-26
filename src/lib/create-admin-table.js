// Script to create the admins table and add a user as admin
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mbeifzjbssmilzzbgfhs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to execute SQL directly
const executeSQL = async (sql) => {
  try {
    console.log('Executing SQL:', sql.substring(0, 100) + '...');
    
    // Execute SQL using RPC
    const { error } = await supabase.rpc('exec_sql', { query_text: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return false;
    }
    
    console.log('SQL executed successfully');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

// Create the admins table
const createAdminsTable = async () => {
  const createAdminsTableSQL = `
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY REFERENCES users(id),
    email TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `;
  
  return await executeSQL(createAdminsTableSQL);
};

// Create the admins table
async function main() {
  console.log('Creating admins table...');
  const success = await createAdminsTable();
  
  if (success) {
    console.log('Admins table created successfully!');
    console.log('\nNow you can add yourself as an admin using SQL in Supabase:');
    console.log(`
    INSERT INTO admins (id, email, is_admin)
    VALUES ('your-user-id', 'your-email@example.com', true);
    `);
  } else {
    console.error('Failed to create admins table.');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit()); 