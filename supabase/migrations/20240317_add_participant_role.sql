-- Drop existing constraint if it exists
ALTER TABLE trip_participants DROP CONSTRAINT IF EXISTS trip_participants_role_check;

-- Add role column to trip_participants table if it doesn't exist
ALTER TABLE trip_participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant';

-- Update existing participants to have 'participant' role
UPDATE trip_participants 
SET role = 'participant'
WHERE role IS NULL OR role NOT IN ('participant', 'guide', 'organizer');

-- Add constraint to ensure role is one of the allowed values
ALTER TABLE trip_participants
ADD CONSTRAINT trip_participants_role_check
CHECK (role IN ('participant', 'guide', 'organizer')); 