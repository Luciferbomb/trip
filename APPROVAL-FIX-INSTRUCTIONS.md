# How to Fix Trip Participant Approval Issues

This document provides step-by-step instructions to fix issues with approving/rejecting participants in the Hireyth app.

## Database Schema Fix

1. First, log into your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project and select "SQL Editor" from the left sidebar
3. Create a new query and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the SQL. This will:
   - Add the `updated_at` column if it doesn't exist
   - Create a trigger to automatically update the timestamp
   - Force a schema refresh to ensure the API recognizes the changes
   - Update all trips to have accurate participant counts

## Application Restart

After applying the database fixes:

1. Stop your development server (if running)
2. Restart your development server with `npm run dev`
3. Test the application by logging in and trying to approve or reject participants

## Troubleshooting

If you're still having issues:

1. Open your browser's developer console (F12 or right-click → Inspect)
2. Navigate to the Trip Details page
3. Try to approve/reject a participant
4. Check the console for any error messages

Most likely issues:
- Schema cache issues (try running the SQL script again)
- Toast notification conflicts (the fixes in this repo address this)
- Network connectivity problems (check your Supabase connection)

## Long-term Fix

The permanent fix includes:
1. The SQL script above to fix the schema
2. Enhanced error handling in the `handleParticipantAction` function
3. Improved toast notification handling to prevent React hook violations

If the issue persists, please open an issue with the specific error messages from your browser console. 