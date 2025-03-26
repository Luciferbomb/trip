/**
 * Script to create missing tables in the Supabase database
 * 
 * Run this with Node.js:
 * node fixTables.js
 */

// Import fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Supabase credentials - replace with actual values or use environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'your-supabase-key';

// Tables definitions
const tables = {
  experience_likes: {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: { type: 'expression', value: 'uuid_generate_v4()' }
    },
    experience_id: {
      type: 'uuid',
      references: 'experiences.id',
      on_delete: 'cascade'
    },
    user_id: {
      type: 'uuid',
      references: 'users.id',
      on_delete: 'cascade'
    },
    created_at: {
      type: 'timestamp with time zone',
      default: { type: 'expression', value: 'now()' }
    }
  },
  experience_comments: {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: { type: 'expression', value: 'uuid_generate_v4()' }
    },
    experience_id: {
      type: 'uuid',
      references: 'experiences.id',
      on_delete: 'cascade'
    },
    user_id: {
      type: 'uuid',
      references: 'users.id',
      on_delete: 'cascade'
    },
    comment: {
      type: 'text',
      notNull: true
    },
    created_at: {
      type: 'timestamp with time zone',
      default: { type: 'expression', value: 'now()' }
    },
    updated_at: {
      type: 'timestamp with time zone',
      default: { type: 'expression', value: 'now()' }
    }
  }
};

// Function to create Supabase RPC function as a workaround
async function createRpcFunction() {
  console.log('Creating functions in the database...');
  
  const sql = `
    -- Create a function for experience_likes
    CREATE OR REPLACE FUNCTION create_experience_likes_table()
    RETURNS void AS $$
    BEGIN
      -- Create the table
      CREATE TABLE IF NOT EXISTS experience_likes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(experience_id, user_id)
      );
    END;
    $$ LANGUAGE plpgsql;

    -- Create a function for experience_comments
    CREATE OR REPLACE FUNCTION create_experience_comments_table()
    RETURNS void AS $$
    BEGIN
      -- Create the table
      CREATE TABLE IF NOT EXISTS experience_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create RPC functions:', errorText);
      return false;
    }
    
    console.log('Functions created successfully');
    return true;
  } catch (error) {
    console.error('Error creating functions:', error);
    return false;
  }
}

// Function to execute SQL
async function executeSql(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to execute SQL:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

// Check if a table exists
async function tableExists(tableName) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/information_schema/tables?select=table_name&table_name=eq.${tableName}&table_schema=eq.public&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to check if table ${tableName} exists:`, errorText);
      return false;
    }
    
    const data = await response.json();
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting database fix script...');
    
    // Check if tables exist
    const likesExists = await tableExists('experience_likes');
    console.log(`experience_likes table exists: ${likesExists}`);
    
    const commentsExists = await tableExists('experience_comments');
    console.log(`experience_comments table exists: ${commentsExists}`);
    
    if (!likesExists || !commentsExists) {
      // Create RPC functions first
      await createRpcFunction();
      
      // Now let's create the actual tables using direct SQL
      if (!likesExists) {
        console.log('Creating experience_likes table...');
        const likesTableSql = `
          CREATE TABLE IF NOT EXISTS experience_likes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(experience_id, user_id)
          );
        `;
        
        const success = await executeSql(likesTableSql);
        if (success) {
          console.log('experience_likes table created successfully');
        }
      }
      
      if (!commentsExists) {
        console.log('Creating experience_comments table...');
        const commentsTableSql = `
          CREATE TABLE IF NOT EXISTS experience_comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            comment TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        const success = await executeSql(commentsTableSql);
        if (success) {
          console.log('experience_comments table created successfully');
        }
      }
      
      console.log('Database fix complete');
    } else {
      console.log('All tables already exist! No fixes needed.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the main function
main(); 