import { supabase } from './supabase';

/**
 * Migration file for setting up the Hireyth Network database
 * This file contains all the necessary functions to create and initialize the database tables
 */

// SQL for creating the trips table
const createTripsTableSQL = `
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  country TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  spots INTEGER NOT NULL DEFAULT 1,
  spots_filled INTEGER NOT NULL DEFAULT 0,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_name TEXT,
  creator_image TEXT,
  activity TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policies for trips table
CREATE POLICY "Trips are viewable by everyone" 
  ON trips FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own trips" 
  ON trips FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own trips" 
  ON trips FOR UPDATE 
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own trips" 
  ON trips FOR DELETE 
  USING (auth.uid() = creator_id);
`;

// SQL for creating the users table
const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  location TEXT,
  profile_image TEXT,
  bio TEXT,
  instagram TEXT,
  linkedin TEXT,
  experiences_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_reason TEXT,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL for creating the notifications table
const createNotificationsTableSQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT,
  message TEXT NOT NULL,
  related_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL for creating the trip_participants table
const createTripParticipantsTableSQL = `
CREATE TABLE IF NOT EXISTS trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Enable RLS
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;

-- Policies for trip_participants table
CREATE POLICY "Participants are viewable by everyone"
  ON trip_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can request to join trips"
  ON trip_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    (
      SELECT CASE 
        WHEN spots_filled < spots THEN true
        ELSE false
      END
      FROM trips
      WHERE id = trip_id
    )
  );

CREATE POLICY "Trip creators can manage participants"
  ON trip_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE id = trip_id
      AND creator_id = auth.uid()
    )
  );
`;

// SQL for creating the experiences table
const createExperiencesTableSQL = `
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL for creating the user_follows table
const createUserFollowsTableSQL = `
CREATE TABLE IF NOT EXISTS user_follows (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create trigger to update followers/following count
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment followers_count for the user being followed
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Increment following_count for the follower
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement followers_count for the user being unfollowed
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    -- Decrement following_count for the follower
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();
`;

// SQL for adding onboarding_completed field to users table if it doesn't exist
const addOnboardingCompletedFieldSQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
`;

// SQL for creating the experience_likes table
const createExperienceLikesTableSQL = `
CREATE TABLE IF NOT EXISTS experience_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experience_id, user_id)
);
`;

// SQL for creating the experience_comments table
const createExperienceCommentsTableSQL = `
CREATE TABLE IF NOT EXISTS experience_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// Create the admins table
const createAdminsTableSQL = `
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY REFERENCES users(id),
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

/**
 * Execute SQL directly using Supabase's REST API
 * @param sql SQL statement to execute
 * @returns Promise<boolean> indicating success or failure
 */
export const executeSQL = async (sql: string): Promise<boolean> => {
  try {
    console.log('Executing SQL:', sql.substring(0, 50) + '...');
    
    // Try to execute the SQL directly
    const response = await fetch('https://mbeifzjbssmilzzbgfhs.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k'
      },
      body: JSON.stringify({
        sql: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SQL execution failed:', response.status, response.statusText, errorText);
      throw new Error(`SQL execution failed: ${response.statusText}. ${errorText}`);
    }
    
    console.log('SQL executed successfully');
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
};

/**
 * Check if a table exists in the database
 * @param tableName Name of the table to check
 * @returns Promise<boolean> indicating if the table exists
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    console.log(`Checking if ${tableName} table exists...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error && error.code === '42P01') {
      // Table doesn't exist
      console.log(`${tableName} table does not exist`);
      return false;
    } else if (error) {
      // Other error
      console.error(`Error checking ${tableName} table:`, error);
      return false;
    } else {
      // Table exists
      console.log(`${tableName} table exists`);
      return true;
    }
  } catch (error) {
    console.error(`Error checking ${tableName} table:`, error);
    return false;
  }
};

/**
 * Create a table using a direct insert if SQL execution fails
 * @param tableName Name of the table to create
 * @param sampleData Sample data to insert
 * @returns Promise<boolean> indicating success or failure
 */
export const createTableWithInsert = async (tableName: string, sampleData: any): Promise<boolean> => {
  try {
    console.log(`Creating ${tableName} table with direct insert...`);
    const { error } = await supabase
      .from(tableName)
      .insert(sampleData);
      
    if (error && error.code !== '23505') { // Ignore if the record already exists
      console.error(`Error creating ${tableName} table with insert:`, error);
      return false;
    }
    
    console.log(`${tableName} table created successfully with insert`);
    return true;
  } catch (error) {
    console.error(`Error creating ${tableName} table with insert:`, error);
    return false;
  }
};

/**
 * Create the trips table
 * @returns Promise<boolean> indicating success or failure
 */
export const createTripsTable = async (): Promise<boolean> => {
  // First try with SQL
  const sqlSuccess = await executeSQL(createTripsTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('trips', {
    id: 'temp_trip_' + Date.now(),
    title: 'Temporary Trip',
    location: 'Temporary Location',
    description: 'Temporary Description',
    creator_id: 'temp_user',
    created_at: new Date().toISOString()
  });
};

/**
 * Create the users table
 * @returns Promise<boolean> indicating success or failure
 */
export const createUsersTable = async (): Promise<boolean> => {
  // First try with SQL
  const sqlSuccess = await executeSQL(createUsersTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('users', {
    id: 'temp_user',
    name: 'Temporary User',
    email: 'temp@example.com',
    created_at: new Date().toISOString()
  });
};

/**
 * Create the notifications table
 * @returns Promise<boolean> indicating success or failure
 */
export const createNotificationsTable = async (): Promise<boolean> => {
  // First try with SQL
  const sqlSuccess = await executeSQL(createNotificationsTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('notifications', {
    id: 'temp_notification',
    user_id: 'temp_user',
    message: 'Temporary Notification',
    created_at: new Date().toISOString()
  });
};

/**
 * Create the trip_participants table
 * @returns Promise<boolean> indicating success or failure
 */
export const createTripParticipantsTable = async (): Promise<boolean> => {
  // First try with SQL
  const sqlSuccess = await executeSQL(createTripParticipantsTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('trip_participants', {
    id: 'temp_participant_' + Date.now(),
    trip_id: 'temp_trip',
    user_id: 'temp_user',
    status: 'pending',
    created_at: new Date().toISOString()
  });
};

/**
 * Create the experiences table
 * @returns Promise<boolean> indicating success or failure
 */
export const createExperiencesTable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('create_experiences_table', {});
    
    if (error) {
      console.error('Error creating experiences table:', error);
      return false;
    }
    
    console.log('Experiences table created or already exists');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

/**
 * Create the user_follows table
 * @returns Promise<boolean> indicating success or failure
 */
export const createUserFollowsTable = async (): Promise<boolean> => {
  // Try with SQL
  const sqlSuccess = await executeSQL(createUserFollowsTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('user_follows', {
    id: 'temp_follow_' + Date.now(),
    follower_id: 'temp_user1',
    following_id: 'temp_user2',
    created_at: new Date().toISOString()
  });
};

/**
 * Insert sample data into the users table
 * @returns Promise<boolean> indicating success or failure
 */
export const insertSampleUsers = async (): Promise<boolean> => {
  const sampleUsers = [
    {
      id: 'user123',
      name: 'Alex Johnson',
      location: 'San Francisco, CA',
      email: 'alex.j@example.com',
      phone: '+1 (555) 123-4567',
      gender: 'Male',
      profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      bio: 'Travel enthusiast and adventure seeker. Always looking for the next exciting destination!',
      instagram: 'travel_alex',
      linkedin: 'alex-johnson-travel',
      experiences_count: 24
    },
    {
      id: 'user456',
      name: 'Sarah J.',
      location: 'New York, NY',
      email: 'sarah.j@example.com',
      phone: '+1 (555) 987-6543',
      gender: 'Female',
      profile_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      bio: 'Food lover and cultural explorer. I travel to taste the world!',
      instagram: 'sarahj_travels',
      linkedin: 'sarah-j-explorer',
      experiences_count: 18
    }
  ];

  try {
    console.log('Inserting sample users...');
    const { error } = await supabase
      .from('users')
      .upsert(sampleUsers, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting sample users:', error);
      return false;
    }
    
    console.log('Sample users inserted successfully');
    return true;
  } catch (error) {
    console.error('Error inserting sample users:', error);
    return false;
  }
};

/**
 * Insert sample data into the trips table
 * @returns Promise<boolean> indicating success or failure
 */
export const insertSampleTrips = async (): Promise<boolean> => {
  const sampleTrips = [
    {
      id: 'trip1',
      title: 'Exploring the Greek Islands',
      location: 'Santorini, Greece',
      image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-08-15').toISOString(),
      end_date: new Date('2023-08-25').toISOString(),
      spots: 3,
      creator_id: 'user456',
      creator_name: 'Sarah J.',
      creator_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Greece',
      activity: 'Beach, Sightseeing',
      description: 'Join me for an unforgettable journey through the stunning Greek islands. We\'ll explore ancient ruins, enjoy delicious Mediterranean cuisine, and relax on beautiful beaches.',
      created_at: new Date('2023-07-20').toISOString()
    },
    {
      id: 'trip2',
      title: 'Japanese Culture Tour',
      location: 'Tokyo, Japan',
      image_url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-09-10').toISOString(),
      end_date: new Date('2023-09-22').toISOString(),
      spots: 2,
      creator_id: 'user123',
      creator_name: 'Alex J.',
      creator_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Japan',
      activity: 'Cultural, Food',
      description: 'Experience the fascinating blend of ancient traditions and modern innovations in Japan. We\'ll visit temples, try authentic Japanese cuisine, and immerse ourselves in the local culture.',
      created_at: new Date('2023-07-25').toISOString()
    }
  ];

  try {
    console.log('Inserting sample trips...');
    const { error } = await supabase
      .from('trips')
      .upsert(sampleTrips, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting sample trips:', error);
      return false;
    }
    
    console.log('Sample trips inserted successfully');
    return true;
  } catch (error) {
    console.error('Error inserting sample trips:', error);
    return false;
  }
};

/**
 * Add onboarding_completed field to users table
 * @returns Promise<boolean> indicating success or failure
 */
export const addOnboardingCompletedField = async (): Promise<boolean> => {
  // Try with SQL
  return await executeSQL(addOnboardingCompletedFieldSQL);
};

// Create placeholder functions if they don't exist
const createPlaceholderFunctions = async (): Promise<boolean> => {
  try {
    const sql = `
      -- Create placeholder functions for migrations
      CREATE OR REPLACE FUNCTION create_experience_likes_table()
      RETURNS void AS $$
      BEGIN
        NULL;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION create_experience_comments_table()
      RETURNS void AS $$
      BEGIN
        NULL;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating placeholder functions:', error);
      return false;
    }
    
    console.log('Placeholder functions created successfully');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

/**
 * Creates the trip_chats table if it doesn't exist
 */
export const createTripChatsTable = async () => {
  try {
    // Create trip_chats table
    await supabase.rpc('exec_sql', {
      sql_statement: `
        -- Create trip_chats table
        CREATE TABLE IF NOT EXISTS trip_chats (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT 'Trip Discussion',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_trip_chats_trip_id ON trip_chats(trip_id);
        
        -- Enable Row Level Security
        ALTER TABLE trip_chats ENABLE ROW LEVEL SECURITY;

        -- Create policies for trip_chats table
        DROP POLICY IF EXISTS "Anyone can view trip chats" ON trip_chats;
        CREATE POLICY "Anyone can view trip chats" 
          ON trip_chats FOR SELECT 
          TO authenticated 
          USING (true);

        DROP POLICY IF EXISTS "Trip creators can create chats" ON trip_chats;
        CREATE POLICY "Trip creators can create chats" 
          ON trip_chats FOR INSERT 
          TO authenticated 
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM trips 
              WHERE trips.id = trip_id AND trips.creator_id = auth.uid()
            ) OR
            EXISTS (
              SELECT 1 FROM trip_participants
              WHERE trip_participants.trip_id = trip_id
              AND trip_participants.user_id = auth.uid()
              AND trip_participants.status = 'approved'
            )
          );

        DROP POLICY IF EXISTS "Trip creators can update chats" ON trip_chats;
        CREATE POLICY "Trip creators can update chats" 
          ON trip_chats FOR UPDATE 
          TO authenticated 
          USING (EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_id AND trips.creator_id = auth.uid()
          ));

        -- Grant permissions to authenticated users
        GRANT ALL ON trip_chats TO authenticated;
      `
    });

    console.log('Trip chats table created or already exists');
    return true;
  } catch (error) {
    console.error('Error creating trip_chats table:', error);
    return false;
  }
};

/**
 * Creates the trip_messages table if it doesn't exist
 */
export const createTripMessagesTable = async () => {
  try {
    // Create trip_messages table
    await supabase.rpc('exec_sql', {
      sql_statement: `
        -- Create trip_messages table
        CREATE TABLE IF NOT EXISTS trip_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          chat_id UUID NOT NULL REFERENCES trip_chats(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_trip_messages_chat_id ON trip_messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_trip_messages_user_id ON trip_messages(user_id);
        
        -- Enable Row Level Security
        ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for trip_messages table
        DROP POLICY IF EXISTS "Anyone can view trip messages" ON trip_messages;
        CREATE POLICY "Anyone can view trip messages" 
          ON trip_messages FOR SELECT 
          TO authenticated 
          USING (true);

        DROP POLICY IF EXISTS "Approved participants can send messages" ON trip_messages;
        CREATE POLICY "Approved participants can send messages" 
          ON trip_messages FOR INSERT 
          TO authenticated 
          WITH CHECK (
            -- Trip creator can send messages
            EXISTS (
              SELECT 1 FROM trip_chats
              JOIN trips ON trips.id = trip_chats.trip_id
              WHERE trip_chats.id = chat_id
              AND trips.creator_id = auth.uid()
            ) OR
            -- Approved participants can send messages
            EXISTS (
              SELECT 1 FROM trip_participants
              JOIN trip_chats ON trip_chats.trip_id = trip_participants.trip_id
              WHERE trip_chats.id = chat_id
              AND trip_participants.user_id = auth.uid()
              AND trip_participants.status = 'approved'
            )
          );

        DROP POLICY IF EXISTS "Users can only update their own messages" ON trip_messages;
        CREATE POLICY "Users can only update their own messages" 
          ON trip_messages FOR UPDATE 
          TO authenticated 
          USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can only delete their own messages" ON trip_messages;
        CREATE POLICY "Users can only delete their own messages" 
          ON trip_messages FOR DELETE 
          TO authenticated 
          USING (user_id = auth.uid());
          
        -- Trigger function to update the updated_at column
        CREATE OR REPLACE FUNCTION update_trip_chat_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create triggers for updated_at columns
        DROP TRIGGER IF EXISTS update_trip_chats_timestamp ON trip_chats;
        CREATE TRIGGER update_trip_chats_timestamp
        BEFORE UPDATE ON trip_chats
        FOR EACH ROW
        EXECUTE FUNCTION update_trip_chat_timestamp();

        DROP TRIGGER IF EXISTS update_trip_messages_timestamp ON trip_messages;
        CREATE TRIGGER update_trip_messages_timestamp
        BEFORE UPDATE ON trip_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_trip_chat_timestamp();
        
        -- Grant permissions to authenticated users
        GRANT ALL ON trip_messages TO authenticated;
      `
    });

    console.log('Trip messages table created or already exists');
    return true;
  } catch (error) {
    console.error('Error creating trip_messages table:', error);
    return false;
  }
};

/**
 * Run all migrations to set up the database
 * @param insertSamples Whether to insert sample data
 * @returns Promise<boolean> indicating success or failure
 */
export const runMigrations = async (insertSamples: boolean = false): Promise<boolean> => {
  console.log('Running database migrations...');
  
  try {
    // First, check which tables exist to avoid redundant operations
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.warn('Unable to fetch existing tables:', tablesError);
      // Continue with migrations even if we can't check existing tables
    }
    
    // Convert to a Set for O(1) lookups
    const existingTableSet = new Set(existingTables?.map(t => t.table_name) || []);
    const tableExists = (tableName: string) => existingTableSet.has(tableName);
    
    // Create placeholder functions first (if needed)
    await createPlaceholderFunctions();
    
    // Create tables only if they don't exist
    if (!tableExists('users')) await createUsersTable();
    if (!tableExists('trips')) await createTripsTable();
    if (!tableExists('notifications')) await createNotificationsTable();
    if (!tableExists('trip_participants')) await createTripParticipantsTable();
    if (!tableExists('experiences')) await createExperiencesTable();
    if (!tableExists('user_follows')) await createUserFollowsTable();
    
    // Create chat-related tables
    if (!tableExists('trip_chats')) await createTripChatsTable();
    if (!tableExists('trip_messages')) await createTripMessagesTable();
    
    // Only try to create these if they don't exist
    if (!tableExists('experience_likes')) {
      try {
        await createExperienceLikesTable();
      } catch (error) {
        console.warn('Experience likes table creation skipped:', error);
      }
    }
    
    if (!tableExists('experience_comments')) {
      try {
        await createExperienceCommentsTable();
      } catch (error) {
        console.warn('Experience comments table creation skipped:', error);
      }
    }
    
    // Insert sample data in development mode only if tables are empty
    if (insertSamples && import.meta.env.DEV) {
      // Check if users table is empty
      const { count: userCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      if (!countError && (userCount === 0 || userCount === null)) {
        console.log('Inserting sample data...');
        await insertSampleUsers();
        await insertSampleTrips();
      } else {
        console.log('Skipping sample data insertion - tables already contain data');
      }
    }
    
    // Make sure onboarding_completed field exists
    await addOnboardingCompletedField();
    
    // Create admins table
    await executeSQL(createAdminsTableSQL);
    
    console.log('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

export const createExperienceLikesTable = async (): Promise<boolean> => {
  try {
    // First check if the table exists
    const { count, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name', { count: 'exact', head: true })
      .eq('table_name', 'experience_likes')
      .eq('table_schema', 'public');
    
    if (count && count > 0) {
      console.log('Experience likes table already exists');
      return true;
    }
    
    // Create the basic table directly if it doesn't exist
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS experience_likes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(experience_id, user_id)
        );
      `
    });
    
    if (error) {
      // If the direct approach doesn't work, create via the REST API
      console.error('Error creating experience_likes table:', error);
      
      // Create the table object via REST API
      const createTableResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/experience_likes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
        },
        body: JSON.stringify({
          definition: {
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
          unique_constraints: [['experience_id', 'user_id']]
        })
      });
      
      if (!createTableResponse.ok) {
        console.error('Failed to create experience_likes table via REST:', await createTableResponse.text());
        return false;
      }
    }
    
    console.log('Experience likes table created successfully');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export const createExperienceCommentsTable = async (): Promise<boolean> => {
  try {
    // First check if the table exists
    const { count, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name', { count: 'exact', head: true })
      .eq('table_name', 'experience_comments')
      .eq('table_schema', 'public');
    
    if (count && count > 0) {
      console.log('Experience comments table already exists');
      return true;
    }
    
    // Create the basic table directly if it doesn't exist
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS experience_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          comment TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      // If the direct approach doesn't work, create via the REST API
      console.error('Error creating experience_comments table:', error);
      
      // Create the table object via REST API
      const createTableResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/experience_comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
        },
        body: JSON.stringify({
          definition: {
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
        })
      });
      
      if (!createTableResponse.ok) {
        console.error('Failed to create experience_comments table via REST:', await createTableResponse.text());
        return false;
      }
    }
    
    console.log('Experience comments table created successfully');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export default runMigrations; 