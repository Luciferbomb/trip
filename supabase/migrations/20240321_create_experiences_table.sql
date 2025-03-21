-- Create experiences table if it doesn't exist
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);

-- Enable Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for experiences
CREATE POLICY "Anyone can view experiences"
    ON experiences FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own experiences"
    ON experiences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own experiences"
    ON experiences FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own experiences"
    ON experiences FOR DELETE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Create function for running this migration
CREATE OR REPLACE FUNCTION create_experiences_table()
RETURNS BOOLEAN AS $$
BEGIN
    -- This function is used by the application to run this migration
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 