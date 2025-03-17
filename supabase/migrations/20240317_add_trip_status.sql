-- Add status column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing trips to have 'active' status
UPDATE trips 
SET status = 'active'
WHERE status IS NULL;

-- Add constraint to ensure status is one of the allowed values
ALTER TABLE trips
ADD CONSTRAINT trips_status_check
CHECK (status IN ('active', 'cancelled', 'completed')); 