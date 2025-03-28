-- Function to create the users table if it doesn't exist
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    profile_image TEXT,
    bio TEXT,
    instagram TEXT,
    linkedin TEXT,
    experiences_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create the trips table if it doesn't exist
CREATE OR REPLACE FUNCTION create_trips_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to create the notifications table if it doesn't exist
CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT,
    message TEXT NOT NULL,
    related_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql; 