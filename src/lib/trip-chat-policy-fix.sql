-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow trip chat access" ON trip_chats;
DROP POLICY IF EXISTS "Allow creator to create trip chat" ON trip_chats;
DROP POLICY IF EXISTS "Allow trip message access" ON trip_messages;
DROP POLICY IF EXISTS "Allow approved participant to send messages" ON trip_messages;
DROP POLICY IF EXISTS "Allow creator to update trip messages" ON trip_messages;
DROP POLICY IF EXISTS "Allow creator to delete trip messages" ON trip_messages;

-- More permissive policies for debugging
-- For trip_chats table
CREATE POLICY "Anyone can view trip chats" 
ON trip_chats FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Any authenticated user can create chats" 
ON trip_chats FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Any authenticated user can update chats" 
ON trip_chats FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- For trip_messages table
CREATE POLICY "Anyone can view trip messages" 
ON trip_messages FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Any authenticated user can send messages" 
ON trip_messages FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Any authenticated user can update messages" 
ON trip_messages FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Any authenticated user can delete messages" 
ON trip_messages FOR DELETE 
TO authenticated
USING (true);

-- Notify to reload the schema
NOTIFY pgrst, 'reload schema'; 