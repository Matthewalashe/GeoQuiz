-- ============================================
-- Wanda — Notifications & Push Subscriptions
-- Run in Supabase SQL Editor
-- ============================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('streak','level_up','achievement','listing','deal','community','daily_reward')),
  title text NOT NULL,
  body text NOT NULL,
  icon text DEFAULT '🔔',
  link text,                 -- in-app route e.g. '/deals', '/dashboard'
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications (user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark read) their own
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admin/system can insert for any user
DROP POLICY IF EXISTS "System insert notifications" ON notifications;
CREATE POLICY "System insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subs" ON push_subscriptions;
CREATE POLICY "Users manage own push subs" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══ DONE ═══
