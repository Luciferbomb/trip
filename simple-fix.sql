-- IMPORTANT: Run this script in your Supabase SQL Editor to fix the "updated_at column does not exist" error

-- Add the updated_at column to trip_participants table
ALTER TABLE trip_participants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create/update the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automated timestamp updates
DROP TRIGGER IF EXISTS update_trip_participants_updated_at ON trip_participants;
CREATE TRIGGER update_trip_participants_updated_at
    BEFORE UPDATE ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Force refresh of schema cache 
SELECT pg_notify('pgrst', 'reload schema');

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trip_participants' 
ORDER BY ordinal_position; 