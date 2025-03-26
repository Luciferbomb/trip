-- Script to create the experience_likes and experience_comments tables

-- Create experience_likes table
CREATE TABLE IF NOT EXISTS experience_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experience_id, user_id)
);

-- Enable RLS for experience_likes
ALTER TABLE experience_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for experience_likes
CREATE POLICY "Experience likes are viewable by everyone"
  ON experience_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like/unlike experiences"
  ON experience_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their likes"
  ON experience_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create experience_comments table
CREATE TABLE IF NOT EXISTS experience_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for experience_comments
ALTER TABLE experience_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for experience_comments
CREATE POLICY "Experience comments are viewable by everyone"
  ON experience_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment on experiences"
  ON experience_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON experience_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON experience_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experience_likes_experience_id ON experience_likes(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_likes_user_id ON experience_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_comments_experience_id ON experience_comments(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_comments_user_id ON experience_comments(user_id);

-- Create a function to handle the execution of all these commands in Supabase
CREATE OR REPLACE FUNCTION create_experience_likes_table()
RETURNS void AS $$
BEGIN
  -- The function body is actually empty because the SQL above will be executed directly
  -- This is just a placeholder to satisfy the API calls
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle the execution of all these commands in Supabase
CREATE OR REPLACE FUNCTION create_experience_comments_table()
RETURNS void AS $$
BEGIN
  -- The function body is actually empty because the SQL above will be executed directly
  -- This is just a placeholder to satisfy the API calls
END;
$$ LANGUAGE plpgsql; 