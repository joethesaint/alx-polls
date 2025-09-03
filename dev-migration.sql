-- Development migration to allow nullable user_id for dev mode
-- This allows polls to be created without a real user in development

-- Make user_id nullable and remove foreign key constraint temporarily for dev
ALTER TABLE polls ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure user_id is either a valid UUID or the dev user ID
ALTER TABLE polls ADD CONSTRAINT dev_user_check 
  CHECK (user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000001'::uuid OR 
         EXISTS (SELECT 1 FROM auth.users WHERE id = user_id));

-- Update RLS policies to handle dev users
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
CREATE POLICY "Users can view their own polls" 
  ON polls FOR SELECT 
  USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000001'::uuid OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own polls" ON polls;
CREate POLICY "Users can insert their own polls" 
  ON polls FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000001'::uuid OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000001'::uuid OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000001'::uuid OR user_id IS NULL);