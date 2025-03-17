-- Create feed table
CREATE TABLE IF NOT EXISTS feed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'trip_created', 'trip_joined', 'experience_shared', etc.
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feed_items_user_id ON feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON feed_items(created_at);

-- Enable RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view feed items from people they follow"
    ON feed_items FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT following_id 
            FROM user_follows 
            WHERE follower_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Function to create feed item when a trip is created
CREATE OR REPLACE FUNCTION create_trip_feed_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO feed_items (user_id, type, content, metadata)
    VALUES (
        NEW.creator_id,
        'trip_created',
        NEW.creator_name || ' created a new trip: ' || NEW.title,
        jsonb_build_object(
            'trip_id', NEW.id,
            'trip_title', NEW.title,
            'trip_image', NEW.image_url,
            'trip_location', NEW.location
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create feed item when a user joins a trip
CREATE OR REPLACE FUNCTION create_trip_joined_feed_item()
RETURNS TRIGGER AS $$
DECLARE
    trip_data record;
    user_data record;
BEGIN
    IF NEW.status = 'approved' THEN
        -- Get trip details
        SELECT title, location, image_url
        INTO trip_data
        FROM trips
        WHERE id = NEW.trip_id;
        
        -- Get user details
        SELECT name, username
        INTO user_data
        FROM users
        WHERE id = NEW.user_id;
        
        INSERT INTO feed_items (user_id, type, content, metadata)
        VALUES (
            NEW.user_id,
            'trip_joined',
            user_data.name || ' joined a trip: ' || trip_data.title,
            jsonb_build_object(
                'trip_id', NEW.trip_id,
                'trip_title', trip_data.title,
                'trip_image', trip_data.image_url,
                'trip_location', trip_data.location,
                'username', user_data.username
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create feed item when a user shares an experience
CREATE OR REPLACE FUNCTION create_experience_feed_item()
RETURNS TRIGGER AS $$
DECLARE
    user_data record;
BEGIN
    -- Get user details
    SELECT name, username
    INTO user_data
    FROM users
    WHERE id = NEW.user_id;
    
    INSERT INTO feed_items (user_id, type, content, metadata)
    VALUES (
        NEW.user_id,
        'experience_shared',
        user_data.name || ' shared a new experience: ' || NEW.title,
        jsonb_build_object(
            'experience_id', NEW.id,
            'experience_title', NEW.title,
            'experience_image', NEW.image_url,
            'experience_location', NEW.location,
            'username', user_data.username
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS create_trip_feed_item_trigger ON trips;
CREATE TRIGGER create_trip_feed_item_trigger
    AFTER INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION create_trip_feed_item();

DROP TRIGGER IF EXISTS create_trip_joined_feed_item_trigger ON trip_participants;
CREATE TRIGGER create_trip_joined_feed_item_trigger
    AFTER INSERT OR UPDATE OF status ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION create_trip_joined_feed_item();

DROP TRIGGER IF EXISTS create_experience_feed_item_trigger ON experiences;
CREATE TRIGGER create_experience_feed_item_trigger
    AFTER INSERT ON experiences
    FOR EACH ROW
    EXECUTE FUNCTION create_experience_feed_item(); 