-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN NOT NULL DEFAULT false
);

-- Create a function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create a trigger to update updated_at on polls table
CREATE TRIGGER on_polls_update
BEFORE UPDATE ON polls
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();


-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create votes table to track who has voted
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, user_id),
  CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR voter_ip_hash IS NOT NULL)
);

-- Set up Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view their own polls" 
  ON polls FOR SELECT 
  USING (user_id = auth.uid());

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" 
  ON polls FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can only update or delete their own polls
CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  USING (user_id = auth.uid());

-- Poll options policies
-- Users can view options for polls they own
CREATE POLICY "Users can view options for their own polls" 
  ON poll_options FOR SELECT 
  USING ((SELECT user_id FROM polls WHERE id = poll_options.poll_id) = auth.uid());

-- Poll owners can create, update, or delete options
CREATE POLICY "Poll owners can manage options" 
  ON poll_options FOR ALL
  USING ((SELECT user_id FROM polls WHERE id = poll_options.poll_id) = auth.uid());

-- Poll votes policies
-- Users can view votes for their own polls
CREATE POLICY "Users can view votes for their own polls" 
  ON poll_votes FOR SELECT 
  USING ((SELECT user_id FROM polls WHERE id = poll_votes.poll_id) = auth.uid());

-- Anyone can vote on public polls
CREATE POLICY "Anyone can vote on public polls" 
  ON poll_votes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id AND polls.is_public = TRUE
    )
  );

-- Create function to increment vote count when a vote is cast
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $
BEGIN
  UPDATE poll_options
  SET votes = votes + 1
  WHERE id = NEW.option_id;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to increment vote count
CREATE TRIGGER increment_vote_count_trigger
AFTER INSERT ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION increment_vote_count();