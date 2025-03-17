-- Create the create_trips_table function
CREATE OR REPLACE FUNCTION create_trips_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trips') THEN
    -- Create the trips table
    CREATE TABLE public.trips (
      id UUID PRIMARY KEY,
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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

    -- Create a policy that allows all operations for now
    CREATE POLICY "Allow all operations for now" ON public.trips
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create the create_users_table function
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Create the users table
    CREATE TABLE public.users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      location TEXT,
      gender TEXT,
      bio TEXT,
      profile_image TEXT,
      instagram TEXT,
      linkedin TEXT,
      experiences_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Create a policy that allows all operations for now
    CREATE POLICY "Allow all operations for now" ON public.users
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create the create_trip_participants_table function
CREATE OR REPLACE FUNCTION create_trip_participants_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trip_participants') THEN
    -- Create the trip_participants table
    CREATE TABLE public.trip_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(trip_id, user_id)
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

    -- Create a policy that allows all operations for now
    CREATE POLICY "Allow all operations for now" ON public.trip_participants
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create the create_notifications_table function
CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- Create the notifications table
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- join_request, comment, trip_update
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      related_id TEXT, -- Could be a trip_id, comment_id, etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    -- Create a policy that allows all operations for now
    CREATE POLICY "Allow all operations for now" ON public.notifications
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create the setup_database function to run all the above functions
CREATE OR REPLACE FUNCTION setup_database()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Make sure the uuid-ossp extension is available
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Create all tables
  PERFORM create_users_table();
  PERFORM create_trips_table();
  PERFORM create_trip_participants_table();
  PERFORM create_notifications_table();
END;
$$; 