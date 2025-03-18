-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS trip_participants CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with UUID primary keys
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    username CITEXT UNIQUE,
    name TEXT,
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

-- Create trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    spots INTEGER DEFAULT 1,
    spots_filled INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_name TEXT,
    creator_image TEXT,
    country TEXT,
    activity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT NOT NULL,
    related_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_participants table
CREATE TABLE trip_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Create experiences table
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_follows table
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trips_creator_id ON trips(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Create trigger function for updating follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment followers_count for the user being followed
        UPDATE users 
        SET followers_count = COALESCE(followers_count, 0) + 1 
        WHERE id = NEW.following_id;
        
        -- Increment following_count for the follower
        UPDATE users 
        SET following_count = COALESCE(following_count, 0) + 1 
        WHERE id = NEW.follower_id;
        
        -- Create notification for new follower
        INSERT INTO notifications (user_id, type, message, related_id)
        VALUES (NEW.following_id, 'follow', 
               (SELECT name FROM users WHERE id = NEW.follower_id) || ' started following you',
               NEW.follower_id::text);
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement followers_count for the user being unfollowed
        UPDATE users 
        SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) 
        WHERE id = OLD.following_id;
        
        -- Decrement following_count for the follower
        UPDATE users 
        SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) 
        WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can update their trips" ON trips;
DROP POLICY IF EXISTS "Trip creators can delete their trips" ON trips;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view trip participants" ON trip_participants;
DROP POLICY IF EXISTS "Users can join trips" ON trip_participants;
DROP POLICY IF EXISTS "Users can update own trip participation" ON trip_participants;
DROP POLICY IF EXISTS "Anyone can view experiences" ON experiences;
DROP POLICY IF EXISTS "Users can create own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can update own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can delete own experiences" ON experiences;
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow/unfollow" ON user_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON user_follows;

-- Create policies for users table
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can insert during signup"
    ON users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id::text);

-- Create policies for trips table
CREATE POLICY "Anyone can view trips"
    ON trips FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create trips"
    ON trips FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Trip creators can update their trips"
    ON trips FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = creator_id::text);

CREATE POLICY "Trip creators can delete their trips"
    ON trips FOR DELETE
    TO authenticated
    USING (auth.uid()::text = creator_id::text);

-- Create policies for notifications table
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policies for trip_participants table
CREATE POLICY "Users can view trip participants"
    ON trip_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join trips"
    ON trip_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own trip participation"
    ON trip_participants FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Create policies for experiences table
CREATE POLICY "Anyone can view experiences"
    ON experiences FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create own experiences"
    ON experiences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own experiences"
    ON experiences FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own experiences"
    ON experiences FOR DELETE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Create policies for user_follows table
CREATE POLICY "Anyone can view follows"
    ON user_follows FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can follow/unfollow"
    ON user_follows FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = follower_id::text);

CREATE POLICY "Users can delete own follows"
    ON user_follows FOR DELETE
    TO authenticated
    USING (auth.uid()::text = follower_id::text);

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Drop ALL existing storage policies
DO $$ 
BEGIN
    -- Drop all existing policies on storage.objects
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can upload profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view trip images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can upload trip images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can delete own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can delete own trip images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view experience images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can upload experience images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can delete own experience images" ON storage.objects;
    DROP POLICY IF EXISTS "storage_public_access" ON storage.objects;
    DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
    DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
    DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create buckets for file storage if they don't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-images', 'profile-images', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('trip-images', 'trip-images', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('experience-images', 'experience-images', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Set up new storage policies
DO $$ 
BEGIN
    -- Create policy for public access to images
    CREATE POLICY "storage_public_access"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id IN ('profile-images', 'trip-images', 'experience-images'));

    -- Create policy for authenticated users to upload images
    CREATE POLICY "storage_auth_upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id IN ('profile-images', 'trip-images', 'experience-images') AND
            (auth.uid() = owner::uuid)
        );

    -- Create policy for users to update their own images
    CREATE POLICY "storage_auth_update"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (owner::uuid = auth.uid());

    -- Create policy for users to delete their own images
    CREATE POLICY "storage_auth_delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (owner::uuid = auth.uid());
END $$;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 