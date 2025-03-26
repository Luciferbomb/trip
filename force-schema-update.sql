-- Backup existing data
CREATE TEMP TABLE trip_participants_backup AS 
SELECT * FROM trip_participants;

-- Drop the existing table
DROP TABLE IF EXISTS trip_participants CASCADE;

-- Recreate the table with the updated_at column 
CREATE TABLE trip_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Restore data 
INSERT INTO trip_participants (id, trip_id, user_id, status, created_at, updated_at)
SELECT 
    id, 
    trip_id, 
    user_id, 
    status, 
    created_at, 
    COALESCE(updated_at, NOW()) -- Handle case if column didn't exist before
FROM trip_participants_backup;

-- Create trigger for trip_participants table timestamps
DROP TRIGGER IF EXISTS update_trip_participants_updated_at ON trip_participants;
CREATE TRIGGER update_trip_participants_updated_at
    BEFORE UPDATE ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Re-enable Row Level Security
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;

-- Recreate policies for trip_participants table
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

-- Force schema reload
SELECT pg_notify('pgrst', 'reload schema');

-- Add a comment to further trigger cache refresh
COMMENT ON TABLE trip_participants IS 'Table for tracking trip participants with updated schema';
