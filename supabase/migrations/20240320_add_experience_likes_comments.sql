-- Create experience_likes table
CREATE TABLE IF NOT EXISTS experience_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experience_id, user_id)
);

-- Create experience_comments table
CREATE TABLE IF NOT EXISTS experience_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experience_likes_experience_id ON experience_likes(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_likes_user_id ON experience_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_comments_experience_id ON experience_comments(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_comments_user_id ON experience_comments(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE experience_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for experience_likes
CREATE POLICY "Anyone can view experience likes"
    ON experience_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can like/unlike experiences"
    ON experience_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own likes"
    ON experience_likes FOR DELETE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Create RLS policies for experience_comments
CREATE POLICY "Anyone can view experience comments"
    ON experience_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can add comments"
    ON experience_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments"
    ON experience_comments FOR DELETE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Create function to update user notification on new comment
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    experience_owner_id UUID;
    commenter_name TEXT;
    experience_title TEXT;
BEGIN
    -- Get experience owner and title
    SELECT experiences.user_id, experiences.title INTO experience_owner_id, experience_title
    FROM experiences
    WHERE experiences.id = NEW.experience_id;

    -- Get commenter name
    SELECT name INTO commenter_name
    FROM users
    WHERE id = NEW.user_id;

    -- Don't notify if user is commenting on their own experience
    IF NEW.user_id <> experience_owner_id THEN
        -- Insert notification for experience owner
        INSERT INTO notifications (
            user_id,
            type,
            message,
            related_id,
            metadata
        )
        VALUES (
            experience_owner_id,
            'comment',
            commenter_name || ' commented on your experience: ' || experience_title,
            NEW.experience_id,
            jsonb_build_object(
                'comment_id', NEW.id,
                'experience_id', NEW.experience_id,
                'commenter_id', NEW.user_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS new_comment_notification_trigger ON experience_comments;
CREATE TRIGGER new_comment_notification_trigger
    AFTER INSERT ON experience_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment_notification();

-- Function to update like counts in feed items
CREATE OR REPLACE FUNCTION update_experience_likes_in_feed()
RETURNS TRIGGER AS $$
BEGIN
    -- Update feed item metadata with the new likes count
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        WITH like_counts AS (
            SELECT COUNT(*) as total
            FROM experience_likes
            WHERE experience_id = COALESCE(NEW.experience_id, OLD.experience_id)
        )
        UPDATE feed_items
        SET metadata = jsonb_set(
            metadata,
            '{likes_count}',
            to_jsonb((SELECT total FROM like_counts))
        )
        WHERE 
            type = 'experience_shared' AND
            metadata->>'experience_id' = COALESCE(NEW.experience_id, OLD.experience_id)::text;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating likes count in feed items
DROP TRIGGER IF EXISTS update_experience_likes_feed_trigger ON experience_likes;
CREATE TRIGGER update_experience_likes_feed_trigger
    AFTER INSERT OR DELETE ON experience_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_experience_likes_in_feed(); 