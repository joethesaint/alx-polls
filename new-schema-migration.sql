-- New Database Schema Migration
-- This script migrates from the old schema (title, description, is_public, allow_multiple_votes)
-- to the new schema (question field only) with separate poll_options and votes tables

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;

-- Create polls table with new schema
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, option_id, user_id),
  CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR voter_ip IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_polls_user_id ON polls(user_id);
CREATE INDEX idx_polls_created_at ON polls(created_at);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_voter_ip ON votes(voter_ip);

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
-- Users can view all polls (no privacy restrictions in new schema)
CREATE POLICY "All polls are viewable by everyone" 
  ON polls FOR SELECT 
  USING (true);

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" 
  ON polls FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can only update or delete their own polls
CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  USING (user_id = auth.uid());

-- RLS Policies for poll_options table
-- Anyone can view poll options
CREATE POLICY "Poll options are viewable by everyone" 
  ON poll_options FOR SELECT 
  USING (true);

-- Only poll owners can create, update, or delete options
CREATE POLICY "Poll owners can create options" 
  ON poll_options FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll owners can update options" 
  ON poll_options FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll owners can delete options" 
  ON poll_options FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
    )
  );

-- RLS Policies for votes table
-- Anyone can view votes
CREATE POLICY "Votes are viewable by everyone" 
  ON votes FOR SELECT 
  USING (true);

-- Anyone can vote (no restrictions in new schema)
CREATE POLICY "Anyone can vote" 
  ON votes FOR INSERT 
  WITH CHECK (true);

-- Users can only delete their own votes
CREATE POLICY "Users can delete their own votes" 
  ON votes FOR DELETE 
  USING (user_id = auth.uid());

-- Create function to increment vote count when a vote is cast
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE poll_options
  SET votes = votes + 1
  WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement vote count when a vote is removed
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE poll_options
  SET votes = votes - 1
  WHERE id = OLD.option_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain vote counts
CREATE TRIGGER increment_vote_count_trigger
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_vote_count();

CREATE TRIGGER decrement_vote_count_trigger
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_vote_count();

-- Create function to update poll updated_at timestamp
CREATE OR REPLACE FUNCTION update_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_poll_updated_at_trigger
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_updated_at();

-- Grant necessary permissions
GRANT ALL ON polls TO authenticated;
GRANT ALL ON poll_options TO authenticated;
GRANT ALL ON votes TO authenticated;
GRANT ALL ON polls TO anon;
GRANT ALL ON poll_options TO anon;
GRANT ALL ON votes TO anon;

-- Migration complete
-- Note: This is a destructive migration that will drop existing data
-- In production, you would want to migrate existing data before dropping tables