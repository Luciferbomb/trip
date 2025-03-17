-- Function to update experience count
CREATE OR REPLACE FUNCTION update_experience_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment experiences_count for the user
        UPDATE users 
        SET experiences_count = GREATEST(experiences_count + 1, 0),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement experiences_count for the user
        UPDATE users 
        SET experiences_count = GREATEST(experiences_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for experience counts
DROP TRIGGER IF EXISTS update_experience_count_trigger ON experiences;
CREATE TRIGGER update_experience_count_trigger
AFTER INSERT OR DELETE ON experiences
FOR EACH ROW
EXECUTE FUNCTION update_experience_count(); 