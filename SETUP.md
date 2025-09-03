# ALX Polls App Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account and project

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Run the SQL script in your Supabase SQL editor to create the necessary tables:

```sql
-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- polls table
CREATE TABLE IF NOT EXISTS polls (
  id          uuid    DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  question    text    NOT NULL,
  options     text[]  NOT NULL,
  title       text    NOT NULL,
  description text,
  is_public   boolean DEFAULT false,
  allow_multiple_votes boolean DEFAULT false,
  end_date    timestamp with time zone,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL,
  expires_at  timestamp with time zone,
  is_active   boolean DEFAULT true
);

-- votes table
CREATE TABLE IF NOT EXISTS votes (
  id          uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id     uuid    REFERENCES polls(id) ON DELETE CASCADE,
  user_id     uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index integer NOT NULL,
  created_at  timestamp with time zone DEFAULT timezone('utc', now())
);

-- optional: prevent duplicate votes per user per poll (if desired)
CREATE UNIQUE INDEX IF NOT EXISTS unique_vote_per_user_per_poll
  ON votes (poll_id, user_id);
```

### 3. Environment Variables
Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features
- User authentication (login/register)
- Create polls with multiple options
- Public/private poll settings
- Multiple vote allowance
- Dashboard to view created polls
- Poll sharing functionality

## Database Schema
The app uses a simple schema where:
- `polls` table stores poll information with options as a text array
- `votes` table tracks individual votes with option indices
- Row Level Security (RLS) is enabled for data protection

## Troubleshooting
- Ensure Supabase environment variables are correctly set
- Check that database tables are created with the correct schema
- Verify RLS policies are properly configured
- Check browser console for any JavaScript errors
