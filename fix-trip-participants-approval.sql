-- IMPORTANT: Run this in your Supabase SQL Editor to fix participant approval issues

-- Ensure the updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trip_participants' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE trip_participants 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update all existing rows to have a current timestamp
        UPDATE trip_participants SET updated_at = NOW();
    END IF;
END $$;

-- Create or update the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to update the column
DROP TRIGGER IF EXISTS update_trip_participants_updated_at ON trip_participants;
CREATE TRIGGER update_trip_participants_updated_at
    BEFORE UPDATE ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Force schema cache refresh to ensure PostgREST recognizes the changes
SELECT pg_notify('pgrst', 'reload schema');

-- Add a comment to further trigger cache refresh
COMMENT ON TABLE trip_participants IS 'Stores trip participant data with updated_at column';

-- Verify the column exists
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trip_participants' 
ORDER BY ordinal_position;

-- Update spots_filled in all trips to ensure consistency
UPDATE trips t
SET spots_filled = (
    SELECT COUNT(*) 
    FROM trip_participants tp
    WHERE tp.trip_id = t.id 
    AND tp.status = 'approved'
)
WHERE t.status = 'active';

-- Cleanup any stale permissions issues
GRANT ALL ON trip_participants TO authenticated; 