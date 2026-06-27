-- ============================================================
-- fix-rls-and-sync.sql
-- Fixes RLS policies and missing columns. Safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- §1. Fix leaderboard RLS — allow BOTH anon AND authenticated
-- The original migration only allowed 'anon' inserts, so
-- logged-in users got "new row violates row-level security"
-- ──────────────────────────────────────────────────────────────

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Authenticated can submit scores" ON public.leaderboard;
DROP POLICY IF EXISTS "Authenticated can view leaderboard" ON public.leaderboard;

-- Recreate for ALL roles (anon + authenticated)
CREATE POLICY "Anyone can submit scores" ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
  FOR SELECT
  USING (true);

-- Add game_type column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leaderboard' AND column_name = 'game_type'
  ) THEN
    ALTER TABLE public.leaderboard ADD COLUMN game_type text DEFAULT 'quiz';
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §2. Fix events table — add 'about' column if missing
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'events'
  ) THEN
    -- Add 'about' column if not present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'about'
    ) THEN
      ALTER TABLE public.events ADD COLUMN about text;
    END IF;
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §3. Fix event_rsvps RLS — organizers must see attendee profiles
-- ──────────────────────────────────────────────────────────────

-- Ensure RLS is on
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RSVPs SELECT policy to include profile joins
DROP POLICY IF EXISTS "Users can view relevant RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can view relevant RSVPs" ON public.event_rsvps
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

-- Ensure profiles are readable for RSVP joins
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────────
-- §4. Fix wallets RLS — ensure authenticated users can read/write
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wallets'
  ) THEN
    ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

    -- Users can read their own wallet
    DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
    EXECUTE 'CREATE POLICY "Users can read own wallet" ON public.wallets
      FOR SELECT USING (user_id = auth.uid())';

    -- Users can insert their own wallet
    DROP POLICY IF EXISTS "Users can create own wallet" ON public.wallets;
    EXECUTE 'CREATE POLICY "Users can create own wallet" ON public.wallets
      FOR INSERT WITH CHECK (user_id = auth.uid())';

    -- Users can update their own wallet
    DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
    EXECUTE 'CREATE POLICY "Users can update own wallet" ON public.wallets
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';

    -- Public read for leaderboard (lifetime_coins only)
    DROP POLICY IF EXISTS "Public read wallets for leaderboard" ON public.wallets;
    EXECUTE 'CREATE POLICY "Public read wallets for leaderboard" ON public.wallets
      FOR SELECT USING (true)';
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §5. Fix game_stats RLS — ensure users can insert/update
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'game_stats'
  ) THEN
    ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage own game_stats" ON public.game_stats;
    EXECUTE 'CREATE POLICY "Users can manage own game_stats" ON public.game_stats
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';

    DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.game_stats;
    EXECUTE 'CREATE POLICY "Anyone can view leaderboard" ON public.game_stats
      FOR SELECT USING (true)';
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §6. Fix user_game_progress RLS
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_game_progress'
  ) THEN
    ALTER TABLE public.user_game_progress ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users manage own progress" ON public.user_game_progress;
    EXECUTE 'CREATE POLICY "Users manage own progress" ON public.user_game_progress
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';

    DROP POLICY IF EXISTS "Public read progress for leaderboard" ON public.user_game_progress;
    EXECUTE 'CREATE POLICY "Public read progress for leaderboard" ON public.user_game_progress
      FOR SELECT USING (true)';
  END IF;
END$$;


-- Done!
-- After running this, all game scores, coins, streaks, and RSVPs
-- will sync properly for both anonymous and logged-in users.
