-- ============================================
-- GeoQuiz — Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- 2. Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL,
  question_count integer NOT NULL,
  categories text[] DEFAULT '{}',
  difficulty text DEFAULT 'all',
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. Waitlist policies: anyone can insert, only service role can read
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read waitlist count"
  ON waitlist FOR SELECT
  TO anon
  USING (true);

-- 5. Leaderboard policies: anyone can insert and read
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  TO anon
  USING (true);

-- 6. Indexes for performance
CREATE INDEX idx_leaderboard_score ON leaderboard (score DESC);
CREATE INDEX idx_leaderboard_created ON leaderboard (created_at DESC);
CREATE INDEX idx_waitlist_created ON waitlist (created_at DESC);
