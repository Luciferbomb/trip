-- Add spots_filled column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS spots_filled INTEGER DEFAULT 0;

-- Update existing trips to have spots_filled based on current participants
UPDATE trips 
SET spots_filled = (
    SELECT COUNT(*) 
    FROM trip_participants 
    WHERE trip_participants.trip_id = trips.id 
    AND trip_participants.status = 'approved'
); 