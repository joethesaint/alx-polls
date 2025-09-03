-- Fix the database schema to work with the app

-- First, let's create a profiles table that the polls table references
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the polls table to remove the problematic created_by field
-- and ensure it works with our app
ALTER TABLE polls DROP COLUMN IF EXISTS created_by;

-- Add any missing columns that might be needed
ALTER TABLE polls ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, username, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (user_id = auth.uid());

-- Update polls policies to work with the new structure
DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
CREATE POLICY "Authenticated users can create polls" 
  ON polls FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Ensure the votes table works with our structure
-- The votes table should reference the poll_id and option_index
-- We'll need to create a function to handle voting with the options array
CREATE OR REPLACE FUNCTION vote_on_poll(
  poll_uuid UUID,
  option_index INTEGER,
  voter_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
  option_text TEXT;
BEGIN
  -- Get the poll details
  SELECT * INTO poll_record FROM polls WHERE id = poll_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if poll is active
  IF NOT poll_record.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if poll has expired
  IF poll_record.expires_at IS NOT NULL AND poll_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Get the option text at the specified index
  IF option_index < 1 OR option_index > array_length(poll_record.options, 1) THEN
    RETURN FALSE;
  END IF;
  
  option_text := poll_record.options[option_index];
  
  -- Check if user has already voted (if user_id is provided)
  IF voter_uuid IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM votes 
      WHERE poll_id = poll_uuid AND user_id = voter_uuid
    ) AND NOT poll_record.allow_multiple_votes THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Insert the vote
  INSERT INTO votes (poll_id, user_id, option_index, created_at)
  VALUES (poll_uuid, voter_uuid, option_index, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
