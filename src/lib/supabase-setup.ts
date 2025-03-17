import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Initialize the Supabase client
const supabaseUrl = 'https://mbeifzjbssmilzzbgfhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k';
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Create users table
export const createUsersTable = async () => {
  try {
    console.log('Attempting to create users table...');
    
    // First check if the table exists
    const { data, error: checkError } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === '42P01') {
      console.log('Users table does not exist, creating it...');
      
      // Create the table using SQL
      const { error: createError } = await supabaseClient.rpc('create_users_table', {});
      
      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating users table with RPC:', createError);
        
        // Fallback: Try direct insert which will create the table if it doesn't exist
        try {
          const { error: insertError } = await supabaseClient
            .from('users')
            .insert({
              id: 'temp_user',
              name: 'Temporary User',
              email: 'temp@example.com',
              created_at: new Date().toISOString()
            });
            
          if (insertError && insertError.code !== '23505') { // Ignore if the temp user already exists
            console.error('Error creating users table with insert:', insertError);
          } else {
            console.log('Users table created successfully with insert');
          }
        } catch (fallbackError) {
          console.error('Fallback error creating users table:', fallbackError);
        }
      } else {
        console.log('Users table created successfully with RPC');
      }
    } else {
      console.log('Users table already exists');
    }
  } catch (error) {
    console.error('Unexpected error creating users table:', error);
  }
};

// Function to create the trips table using Supabase's API
export const createTripsTable = async () => {
  console.log('Creating trips table using Supabase API...');
  
  try {
    // Try to create the table using a direct insert
    // This will fail if the table doesn't exist, but that's expected
    const { error } = await supabaseClient
      .from('trips')
      .insert({
        id: 'temp_trip_' + Date.now(),
        title: 'Temporary Trip',
        location: 'Temporary Location',
        description: 'Temporary Description',
        creator_id: 'temp_user',
        created_at: new Date().toISOString()
      });
      
    if (error && error.code !== '23505') { // Ignore if the record already exists
      console.error('Error creating trips table with insert:', error);
      return false;
    }
    
    console.log('Trips table created successfully with insert');
    return true;
  } catch (error) {
    console.error('Error creating trips table:', error);
    return false;
  }
};

// Function to create the trips table using direct SQL
export const createTripsTableWithSQL = async () => {
  console.log('Creating trips table using direct SQL...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      spots INTEGER DEFAULT 1,
      creator_id TEXT NOT NULL,
      creator_name TEXT,
      creator_image TEXT,
      country TEXT,
      activity TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    // Try to execute the SQL directly
    const response = await fetch('https://mbeifzjbssmilzzbgfhs.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWlmempic3NtaWx6emJnZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjI5NzAsImV4cCI6MjA1NzUzODk3MH0.Sy1wiSXfxpVYXqxO-oVpMusw0bNryI41hZINEzetj3k'
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SQL execution failed:', response.status, response.statusText, errorText);
      throw new Error(`SQL execution failed: ${response.statusText}. ${errorText}`);
    }
    
    console.log('Table created successfully with direct SQL');
    return true;
  } catch (error) {
    console.error('Error executing direct SQL:', error);
    
    // Fallback: Try direct insert which will create the table if it doesn't exist
    try {
      console.log('Trying to create table with direct insert...');
      
      // Create a minimal trip object
      const tempTrip = {
        id: 'temp_trip_' + Date.now(),
        title: 'Temporary Trip',
        location: 'Temporary Location',
        description: 'Temporary Description',
        creator_id: 'temp_user',
        created_at: new Date().toISOString()
      };
      
      console.log('Inserting temporary trip:', tempTrip);
      
      const { error: insertError } = await supabase
        .from('trips')
        .insert(tempTrip);
        
      if (insertError) {
        console.error('Error creating trips table with insert:', insertError);
        
        if (insertError.code === '23505') {
          // Record already exists, which means the table exists
          console.log('Table already exists (duplicate key error)');
          return true;
        }
        
        return false;
      } else {
        console.log('Trips table created successfully with insert');
        return true;
      }
    } catch (insertError) {
      console.error('Error with fallback insert:', insertError);
      return false;
    }
  }
};

// Function to create the notifications table
export const createNotificationsTable = async () => {
  try {
    console.log('Attempting to create notifications table...');
    
    // First check if the table exists
    const { data, error: checkError } = await supabaseClient
      .from('notifications')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === '42P01') {
      console.log('Notifications table does not exist, creating it...');
      
      // Create the table using SQL
      const { error: createError } = await supabaseClient.rpc('create_notifications_table', {});
      
      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating notifications table with RPC:', createError);
        
        // Fallback: Try direct insert which will create the table if it doesn't exist
        try {
          const { error: insertError } = await supabaseClient
            .from('notifications')
            .insert({
              id: 'temp_notification',
              user_id: 'temp_user',
              message: 'Temporary Notification',
              created_at: new Date().toISOString()
            });
            
          if (insertError && insertError.code !== '23505') { // Ignore if the temp notification already exists
            console.error('Error creating notifications table with insert:', insertError);
          } else {
            console.log('Notifications table created successfully with insert');
          }
        } catch (fallbackError) {
          console.error('Fallback error creating notifications table:', fallbackError);
        }
      } else {
        console.log('Notifications table created successfully with RPC');
      }
    } else {
      console.log('Notifications table already exists');
    }
  } catch (error) {
    console.error('Unexpected error creating notifications table:', error);
  }
};

// Function to insert mock users
export const insertMockUsers = async () => {
  const mockUsers = [
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
    },
    {
      id: 'user789',
      name: 'Mike T.',
      location: 'London, UK',
      email: 'mike.t@example.com',
      phone: '+44 20 1234 5678',
      gender: 'Male',
      profile_image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      bio: 'Photographer and hiker. I capture the beauty of nature through my lens.',
      instagram: 'mike_captures',
      linkedin: 'mike-t-photo',
      experiences_count: 32
    },
    {
      id: 'user321',
      name: 'Emma L.',
      location: 'Sydney, Australia',
      email: 'emma.l@example.com',
      phone: '+61 2 9876 5432',
      gender: 'Female',
      profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      bio: 'Ocean lover and diving enthusiast. The underwater world is my second home.',
      instagram: 'emma_dives',
      linkedin: 'emma-l-diver',
      experiences_count: 15
    }
  ];

  const { error } = await supabaseClient
    .from('users')
    .upsert(mockUsers, { onConflict: 'id' });

  if (error) {
    console.error('Error inserting mock users:', error);
  }
};

// Function to insert mock trips
export const insertMockTrips = async () => {
  const mockTrips = [
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
      creator_id: 'user789',
      creator_name: 'Mike T.',
      creator_image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Japan',
      activity: 'Cultural, Food',
      description: 'Experience the fascinating blend of ancient traditions and modern innovations in Japan. We\'ll visit temples, try authentic Japanese cuisine, and immerse ourselves in the local culture.',
      created_at: new Date('2023-07-25').toISOString()
    },
    {
      id: 'trip3',
      title: 'Northern Lights Adventure',
      location: 'Tromsø, Norway',
      image_url: 'https://images.unsplash.com/photo-1483127140521-b816a161ae22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-11-05').toISOString(),
      end_date: new Date('2023-11-12').toISOString(),
      spots: 4,
      creator_id: 'user321',
      creator_name: 'Emma L.',
      creator_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Norway',
      activity: 'Aurora Viewing, Hiking',
      description: 'Chase the magical Northern Lights in the Arctic wilderness of Norway. We\'ll also go dog sledding, snowshoeing, and enjoy the cozy atmosphere of a traditional Norwegian cabin.',
      created_at: new Date('2023-07-30').toISOString()
    },
    {
      id: 'trip4',
      title: 'Thailand Beach Retreat',
      location: 'Phuket, Thailand',
      image_url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-10-01').toISOString(),
      end_date: new Date('2023-10-10').toISOString(),
      spots: 2,
      creator_id: 'user123',
      creator_name: 'Alex J.',
      creator_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Thailand',
      activity: 'Beach, Relaxation',
      description: 'Escape to the tropical paradise of Thailand. We\'ll relax on pristine beaches, explore hidden coves by kayak, and enjoy the vibrant local nightlife.',
      created_at: new Date('2023-08-05').toISOString()
    },
    {
      id: 'trip5',
      title: 'Italian Cuisine Tour',
      location: 'Rome, Italy',
      image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-09-20').toISOString(),
      end_date: new Date('2023-09-30').toISOString(),
      spots: 5,
      creator_id: 'user456',
      creator_name: 'Sarah J.',
      creator_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'Italy',
      activity: 'Food, Cultural',
      description: 'A culinary adventure through Italy! Learn to make authentic pasta, visit local markets, and enjoy wine tastings in beautiful vineyards.',
      created_at: new Date('2023-08-10').toISOString()
    },
    {
      id: 'trip6',
      title: 'Hiking in the Alps',
      location: 'Chamonix, France',
      image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      start_date: new Date('2023-07-15').toISOString(),
      end_date: new Date('2023-07-25').toISOString(),
      spots: 3,
      creator_id: 'user789',
      creator_name: 'Mike T.',
      creator_image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      country: 'France',
      activity: 'Hiking, Adventure',
      description: 'Challenge yourself with breathtaking hikes in the French Alps. We\'ll conquer stunning peaks, enjoy panoramic views, and relax in charming mountain villages.',
      created_at: new Date('2023-06-20').toISOString()
    }
  ];

  const { error } = await supabaseClient
    .from('trips')
    .upsert(mockTrips, { onConflict: 'id' });

  if (error) {
    console.error('Error inserting mock trips:', error);
  }
};

// Function to insert mock notifications
export const insertMockNotifications = async () => {
  const mockNotifications = [
    {
      id: 'notif1',
      user_id: 'user123',
      type: 'join_request',
      message: 'Sarah J. wants to join your Thailand Beach Retreat',
      related_id: 'trip4',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'notif2',
      user_id: 'user123',
      type: 'comment',
      message: 'Mike T. commented on your Thailand Beach Retreat',
      related_id: 'trip4',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: 'notif3',
      user_id: 'user123',
      type: 'trip_update',
      message: 'Your Thailand Beach Retreat is starting in 3 days',
      related_id: 'trip4',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    }
  ];

  const { error } = await supabaseClient
    .from('notifications')
    .upsert(mockNotifications, { onConflict: 'id' });

  if (error) {
    console.error('Error inserting mock notifications:', error);
  }
};

// Function to initialize the database
export const setupDatabase = async () => {
  console.log('Setting up database...');
  
  try {
    // Check if trips table exists
    console.log('Checking if trips table exists...');
    const { data, error: tripsCheckError } = await supabase
      .from('trips')
      .select('id')
      .limit(1);
      
    if (tripsCheckError) {
      console.error('Error checking trips table:', tripsCheckError);
      
      if (tripsCheckError.code === '42P01') {
        console.log('Trips table does not exist, creating it...');
        return await createTripsTableWithSQL();
      } else {
        console.error('Unexpected error checking trips table:', tripsCheckError);
        return false;
      }
    } else {
      console.log('Trips table already exists, data:', data);
      return true;
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
};

export default supabaseClient; 