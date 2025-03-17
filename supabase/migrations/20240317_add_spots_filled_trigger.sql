-- Function to update spots_filled
CREATE OR REPLACE FUNCTION update_trip_spots_filled()
RETURNS TRIGGER AS $$
BEGIN
    -- Update spots_filled for the affected trip
    UPDATE trips
    SET spots_filled = (
        SELECT COUNT(*)
        FROM trip_participants
        WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
        AND status = 'approved'
    )
    WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT, UPDATE, DELETE on trip_participants
DROP TRIGGER IF EXISTS update_trip_spots_filled_trigger ON trip_participants;
CREATE TRIGGER update_trip_spots_filled_trigger
    AFTER INSERT OR UPDATE OR DELETE ON trip_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_spots_filled(); 