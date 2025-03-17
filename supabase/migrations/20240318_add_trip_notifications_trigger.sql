-- Function to handle trip participation notifications
CREATE OR REPLACE FUNCTION handle_trip_participation_notifications()
RETURNS TRIGGER AS $$
DECLARE
    trip_creator_id UUID;
    participant_name TEXT;
    trip_title TEXT;
BEGIN
    -- Get trip creator and trip title
    SELECT creator_id, title INTO trip_creator_id, trip_title
    FROM trips
    WHERE id = NEW.trip_id;

    -- Get participant name
    SELECT name INTO participant_name
    FROM users
    WHERE id = NEW.user_id;

    IF TG_OP = 'INSERT' THEN
        -- New join request
        INSERT INTO notifications (
            user_id,
            type,
            message,
            related_id,
            metadata
        )
        VALUES (
            trip_creator_id,
            'join_request',
            participant_name || ' wants to join your trip: ' || trip_title,
            NEW.trip_id,
            jsonb_build_object(
                'participant_id', NEW.user_id,
                'trip_id', NEW.trip_id,
                'status', 'pending'
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Status change notification
        IF NEW.status = 'approved' THEN
            -- Notify participant of approval
            INSERT INTO notifications (
                user_id,
                type,
                message,
                related_id,
                metadata
            )
            VALUES (
                NEW.user_id,
                'request_approved',
                'Your request to join ' || trip_title || ' has been approved!',
                NEW.trip_id,
                jsonb_build_object(
                    'trip_id', NEW.trip_id,
                    'status', 'approved'
                )
            );
        ELSIF NEW.status = 'rejected' THEN
            -- Notify participant of rejection
            INSERT INTO notifications (
                user_id,
                type,
                message,
                related_id,
                metadata
            )
            VALUES (
                NEW.user_id,
                'request_rejected',
                'Your request to join ' || trip_title || ' has been declined.',
                NEW.trip_id,
                jsonb_build_object(
                    'trip_id', NEW.trip_id,
                    'status', 'rejected'
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trip participation notifications
DROP TRIGGER IF EXISTS trip_participation_notification_trigger ON trip_participants;
CREATE TRIGGER trip_participation_notification_trigger
    AFTER INSERT OR UPDATE OF status ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_trip_participation_notifications();

-- Add metadata column to notifications if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; 