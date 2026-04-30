-- ============================================
-- GeoQuiz — Community Feed Migration
-- Run ONLY this file in Supabase SQL Editor
-- (The waitlist + leaderboard tables already exist)
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author text NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 500),
  parent_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  likes text[] DEFAULT '{}',
  level integer DEFAULT 1,
  reported boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts"
  ON community_posts FOR SELECT
  TO anon
  USING (reported = false);

CREATE POLICY "Anyone can create posts"
  ON community_posts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can like posts"
  ON community_posts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON community_posts (parent_id);
