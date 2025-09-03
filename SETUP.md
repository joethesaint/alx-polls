# ALX Polls App Setup Guide

## Prerequisites
- Node.js 18+
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
-- (RLS policies are defined in supabase-schema.sql and are not included here for brevity)
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
- Dashboard to view created polls
- Poll sharing functionality
- Real-time voting results

## Database Schema
The app uses a simple schema where:
- `polls` table stores poll information (question, user_id, timestamps)
- `poll_options` table stores individual options for each poll
- `poll_votes` table tracks individual votes
- Row Level Security (RLS) is enabled for data protection

## Troubleshooting
- Ensure Supabase environment variables are correctly set
- Check that database tables are created with the correct schema
- Verify RLS policies are properly configured
- Check browser console for any JavaScript errors