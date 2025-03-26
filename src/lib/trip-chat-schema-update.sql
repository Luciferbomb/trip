-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view trip chats" ON trip_chats;
DROP POLICY IF EXISTS "Trip creators can create chats" ON trip_chats;
DROP POLICY IF EXISTS "Trip creators can update chats" ON trip_chats;
DROP POLICY IF EXISTS "Anyone can view trip messages" ON trip_messages;
DROP POLICY IF EXISTS "Approved participants can send messages" ON trip_messages;
DROP POLICY IF EXISTS "Users can only update their own messages" ON trip_messages;
DROP POLICY IF EXISTS "Users can only delete their own messages" ON trip_messages;

-- Create trip_chats table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Trip Discussion',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES trip_chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trip_chats_trip_id ON trip_chats(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_chat_id ON trip_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_user_id ON trip_messages(user_id);

-- Enable Row Level Security
ALTER TABLE trip_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for trip_chats table
CREATE POLICY "Anyone can view trip chats" 
    ON trip_chats FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Trip creators can create chats" 
    ON trip_chats FOR INSERT 
    TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM trips 
        WHERE trips.id = trip_id AND trips.creator_id = auth.uid()
    ));

CREATE POLICY "Trip creators can update chats" 
    ON trip_chats FOR UPDATE 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM trips 
        WHERE trips.id = trip_id AND trips.creator_id = auth.uid()
    ));

-- Create policies for trip_messages table
CREATE POLICY "Anyone can view trip messages" 
    ON trip_messages FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Approved participants can send messages" 
    ON trip_messages FOR INSERT 
    TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM trip_participants
        JOIN trip_chats ON trip_chats.trip_id = trip_participants.trip_id
        WHERE trip_chats.id = chat_id
        AND trip_participants.user_id = auth.uid()
        AND trip_participants.status = 'approved'
    ));

CREATE POLICY "Users can only update their own messages" 
    ON trip_messages FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.uid());

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_trip_chats_timestamp ON trip_chats;
DROP TRIGGER IF EXISTS update_trip_messages_timestamp ON trip_messages;

-- Create triggers for updated_at columns
CREATE TRIGGER update_trip_chats_timestamp
BEFORE UPDATE ON trip_chats
FOR EACH ROW
EXECUTE FUNCTION update_trip_chat_timestamp();

CREATE TRIGGER update_trip_messages_timestamp
BEFORE UPDATE ON trip_messages
FOR EACH ROW
EXECUTE FUNCTION update_trip_chat_timestamp();

-- Grant permissions to authenticated users
GRANT ALL ON trip_chats TO authenticated;
GRANT ALL ON trip_messages TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema'; 