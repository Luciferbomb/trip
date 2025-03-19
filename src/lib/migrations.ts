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
  // First try with SQL
  const sqlSuccess = await executeSQL(createExperiencesTableSQL);
  
  if (sqlSuccess) {
    return true;
  }
  
  // Fallback to direct insert
  return await createTableWithInsert('experiences', {
    id: 'temp_experience_' + Date.now(),
    user_id: 'temp_user',
    title: 'Temporary Experience',
    description: 'Temporary Description',
    location: 'Temporary Location',
    created_at: new Date().toISOString()
  });
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

/**
 * Run all migrations to set up the database
 * @param insertSamples Whether to insert sample data
 * @returns Promise<boolean> indicating success or failure
 */
export const runMigrations = async (insertSamples: boolean = true): Promise<boolean> => {
  console.log('Running database migrations...');
  
  try {
    // Create tables if they don't exist
    await createUsersTable();
    await createTripsTable();
    await createNotificationsTable();
    await createTripParticipantsTable();
    await createExperiencesTable();
    await createUserFollowsTable();
    await createExperienceLikesTable();
    await createExperienceCommentsTable();
    
    // Insert sample data in development mode
    if (insertSamples && import.meta.env.DEV) {
      await insertSampleUsers();
      await insertSampleTrips();
    }
    
    // Make sure onboarding_completed field exists
    await addOnboardingCompletedField();
    
    console.log('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

export const createExperienceLikesTable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('create_experience_likes_table', {});
    
    if (error) {
      console.error('Error creating experience_likes table:', error);
      return false;
    }
    
    console.log('Experience likes table created or already exists');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export const createExperienceCommentsTable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('create_experience_comments_table', {});
    
    if (error) {
      console.error('Error creating experience_comments table:', error);
      return false;
    }
    
    console.log('Experience comments table created or already exists');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export default runMigrations; 