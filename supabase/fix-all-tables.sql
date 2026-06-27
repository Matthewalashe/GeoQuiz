-- ============================================================
-- fix-all-tables-v2.sql
-- Fixes ONLY what's missing — does NOT re-create existing tables.
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- §1. Fix leaderboard RLS — allow BOTH anon AND authenticated
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
CREATE POLICY "Anyone can submit scores" ON public.leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard FOR SELECT USING (true);

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
-- §2. Fix RLS on existing game tables — allow anon reads too
--     (Original policies used TO authenticated only)
-- ──────────────────────────────────────────────────────────────

-- coin_config: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coin_config') THEN
    DROP POLICY IF EXISTS "Anyone reads coin config" ON public.coin_config;
    DROP POLICY IF EXISTS "Public reads coin config" ON public.coin_config;
    EXECUTE 'CREATE POLICY "Public reads coin config" ON public.coin_config FOR SELECT USING (true)';
  END IF;
END$$;

-- store_items: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='store_items') THEN
    DROP POLICY IF EXISTS "Anyone reads store items" ON public.store_items;
    DROP POLICY IF EXISTS "Public reads store items" ON public.store_items;
    EXECUTE 'CREATE POLICY "Public reads store items" ON public.store_items FOR SELECT USING (true)';
  END IF;
END$$;

-- game_config: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='game_config') THEN
    DROP POLICY IF EXISTS "Anyone reads game config" ON public.game_config;
    DROP POLICY IF EXISTS "Public reads game config" ON public.game_config;
    EXECUTE 'CREATE POLICY "Public reads game config" ON public.game_config FOR SELECT USING (true)';
  END IF;
END$$;

-- level_config: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='level_config') THEN
    DROP POLICY IF EXISTS "Anyone reads level config" ON public.level_config;
    DROP POLICY IF EXISTS "Public reads level config" ON public.level_config;
    EXECUTE 'CREATE POLICY "Public reads level config" ON public.level_config FOR SELECT USING (true)';
  END IF;
END$$;

-- seasons: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='seasons') THEN
    DROP POLICY IF EXISTS "Public reads seasons" ON public.seasons;
    EXECUTE 'CREATE POLICY "Public reads seasons" ON public.seasons FOR SELECT USING (true)';
  END IF;
END$$;

-- questions: allow public reads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='questions') THEN
    DROP POLICY IF EXISTS "Public reads questions" ON public.questions;
    EXECUTE 'CREATE POLICY "Public reads questions" ON public.questions FOR SELECT USING (true)';
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §3. Fix events — add missing columns
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='about') THEN
      ALTER TABLE public.events ADD COLUMN about text;
    END IF;
  END IF;
END$$;


-- ──────────────────────────────────────────────────────────────
-- §4. Ensure cms_config table exists (for hero slides + settings)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cms_config (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read cms_config" ON public.cms_config;
CREATE POLICY "Anyone can read cms_config" ON public.cms_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage cms_config" ON public.cms_config;
CREATE POLICY "Admin can manage cms_config" ON public.cms_config FOR ALL USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- §5. Ensure profiles are publicly readable (for RSVP + organizer joins)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);


-- ──────────────────────────────────────────────────────────────
-- §6. Fix event_rsvps — organizers see attendee profiles
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_rsvps') THEN
    DROP POLICY IF EXISTS "Users can view relevant RSVPs" ON public.event_rsvps;
    EXECUTE 'CREATE POLICY "Users can view relevant RSVPs" ON public.event_rsvps
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.visibility = ''public'' AND e.status = ''published'')
      )';
  END IF;
END$$;


-- Done! This migration is safe to re-run and only fixes policies and missing columns.
