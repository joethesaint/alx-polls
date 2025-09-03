-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

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
  voter_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, option_id, user_id),
  CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR voter_ip IS NOT NULL)
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
-- Users can view options for their own polls
CREATE POLICY "Users can view options for their own polls" 
  ON poll_options FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid()
    )
  );

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

-- Poll votes policies
-- Users can view votes for their own polls
CREATE POLICY "Users can view votes for their own polls" 
  ON poll_votes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id AND polls.user_id = auth.uid()
    )
  );

-- Anyone can vote on public polls
CREATE POLICY "Anyone can vote on public polls" 
  ON poll_votes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id AND polls.is_public = TRUE
    )
  );

-- Users can vote on their own polls
CREATE POLICY "Users can vote on their own polls" 
  ON poll_votes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id AND polls.user_id = auth.uid()
    )
  );

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

-- Create trigger to increment vote count
CREATE TRIGGER increment_vote_count_trigger
AFTER INSERT ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION increment_vote_count();