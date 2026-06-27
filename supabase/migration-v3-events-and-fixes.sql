-- ============================================================
-- migration-v3-events-and-fixes.sql
-- 1. Fix: Users can UPDATE their own business_listings
-- 2. Fix: Anyone can view APPROVED business_listings
-- 3. New: Events system tables (plans)
-- 4. New: Game engine tables (coins, levels, store)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- §1. Fix business_listings RLS — allow users to edit own listings
-- ──────────────────────────────────────────────────────────────

-- Allow users to UPDATE their own listings
DROP POLICY IF EXISTS "Users can update own listings" ON public.business_listings;
CREATE POLICY "Users can update own listings" ON public.business_listings
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

-- Allow anyone (including anonymous) to view APPROVED listings
DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.business_listings;
CREATE POLICY "Anyone can view approved listings" ON public.business_listings
  FOR SELECT USING (status = 'approved');


-- ──────────────────────────────────────────────────────────────
-- §2. Events / Plans System
-- ──────────────────────────────────────────────────────────────

-- Event categories
CREATE TABLE IF NOT EXISTS public.event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  emoji text,
  is_custom boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Seed default categories
INSERT INTO public.event_categories (name, emoji) VALUES
  ('Hangout', '🏖️'),
  ('Meeting', '🤝'),
  ('Wedding', '💒'),
  ('Concert', '🎵'),
  ('Crusade', '⛪'),
  ('Birthday', '🎂'),
  ('Beach Day', '🏝️'),
  ('Game Night', '🎮'),
  ('Workshop', '🛠️'),
  ('Conference', '📋'),
  ('Festival', '🎉'),
  ('Networking', '🤝'),
  ('Interview', '💼'),
  ('Graduation', '🎓'),
  ('Owambe', '🥳'),
  ('Watch Party', '📺'),
  ('Movie Night', '🎬'),
  ('Sunday Service', '🙏')
ON CONFLICT (name) DO NOTHING;

-- Events (Plans)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES public.profiles(id) NOT NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  subcategory text,
  image_url text,
  -- Venue
  venue_type text DEFAULT 'physical',  -- 'physical', 'virtual', 'both'
  venue_name text,
  venue_address text,
  meeting_link text,     -- Google Meet / Zoom / WhatsApp link
  listing_id uuid,       -- optional FK to existing listing
  lat float,
  lng float,
  -- Dates
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  start_time text,
  end_time text,
  -- Pricing
  is_free boolean DEFAULT true,
  price numeric(10,2),
  currency text DEFAULT 'NGN',
  payment_link text,     -- bank details or WhatsApp link
  -- Capacity
  max_capacity integer,  -- null = unlimited
  -- Visibility
  visibility text DEFAULT 'public',  -- 'public' or 'private'
  status text DEFAULT 'draft',       -- draft, published, cancelled
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event RSVPs (Plan Responses)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  -- Guest info for non-logged-in users
  guest_name text,
  guest_phone text,
  guest_email text,
  -- RSVP
  status text DEFAULT 'interested',  -- 'interested', 'maybe', 'not_interested'
  has_paid boolean DEFAULT false,
  paid_at timestamptz,
  organizer_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Event reminders
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'manual',  -- 'manual' or 'auto'
  interval_hours integer,
  next_send_at timestamptz,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- §3. Events RLS Policies
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Events: anyone can view public/published events
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
CREATE POLICY "Anyone can view public events" ON public.events
  FOR SELECT USING (
    (visibility = 'public' AND status = 'published')
    OR organizer_id = auth.uid()
  );

-- Events: authenticated users can create
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());

-- Events: organizer can update own events
DROP POLICY IF EXISTS "Organizer can update own events" ON public.events;
CREATE POLICY "Organizer can update own events" ON public.events
  FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Events: organizer can delete own events
DROP POLICY IF EXISTS "Organizer can delete own events" ON public.events;
CREATE POLICY "Organizer can delete own events" ON public.events
  FOR DELETE TO authenticated
  USING (organizer_id = auth.uid());

-- RSVPs: anyone can view RSVPs for events they're part of
DROP POLICY IF EXISTS "Users can view relevant RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can view relevant RSVPs" ON public.event_rsvps
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

-- RSVPs: authenticated users can RSVP
DROP POLICY IF EXISTS "Users can RSVP" ON public.event_rsvps;
CREATE POLICY "Users can RSVP" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RSVPs: allow anonymous insert for guest RSVPs
DROP POLICY IF EXISTS "Guests can RSVP" ON public.event_rsvps;
CREATE POLICY "Guests can RSVP" ON public.event_rsvps
  FOR INSERT TO anon WITH CHECK (user_id IS NULL AND guest_name IS NOT NULL);

-- RSVPs: users can update own RSVP
DROP POLICY IF EXISTS "Users can update own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can update own RSVP" ON public.event_rsvps
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Organizer can update any RSVP for their event (confirm payments)
DROP POLICY IF EXISTS "Organizer can manage RSVPs" ON public.event_rsvps;
CREATE POLICY "Organizer can manage RSVPs" ON public.event_rsvps
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

-- Categories: anyone can read
DROP POLICY IF EXISTS "Anyone can view categories" ON public.event_categories;
CREATE POLICY "Anyone can view categories" ON public.event_categories
  FOR SELECT USING (true);

-- Categories: authenticated can insert custom
DROP POLICY IF EXISTS "Users can add custom categories" ON public.event_categories;
CREATE POLICY "Users can add custom categories" ON public.event_categories
  FOR INSERT TO authenticated WITH CHECK (is_custom = true);

-- Reminders: organizer only
DROP POLICY IF EXISTS "Organizer can manage reminders" ON public.event_reminders;
CREATE POLICY "Organizer can manage reminders" ON public.event_reminders
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));


-- ──────────────────────────────────────────────────────────────
-- §4. Game Engine Tables (coins, levels, store)
-- ──────────────────────────────────────────────────────────────

-- Player game stats (coins, level, XP tracked per user)
CREATE TABLE IF NOT EXISTS public.game_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
  coins integer DEFAULT 0,
  total_coins_earned integer DEFAULT 0,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON public.game_stats;
CREATE POLICY "Users can view own stats" ON public.game_stats
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can upsert own stats" ON public.game_stats;
CREATE POLICY "Users can upsert own stats" ON public.game_stats
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Leaderboard view — anyone can see
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.game_stats;
CREATE POLICY "Anyone can view leaderboard" ON public.game_stats
  FOR SELECT USING (true);

-- Store items (purchasable with coins)
CREATE TABLE IF NOT EXISTS public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,       -- 'skin', 'avatar', 'badge', 'powerup'
  price_coins integer NOT NULL DEFAULT 0,
  image_url text,
  metadata jsonb DEFAULT '{}',  -- flexible extra data per item type
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view store items" ON public.store_items;
CREATE POLICY "Anyone can view store items" ON public.store_items
  FOR SELECT USING (is_active = true);

-- User purchases (inventory)
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  item_id uuid REFERENCES public.store_items(id) NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  equipped boolean DEFAULT false,
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
CREATE POLICY "Users can view own purchases" ON public.user_purchases
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can purchase" ON public.user_purchases;
CREATE POLICY "Users can purchase" ON public.user_purchases
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can equip own items" ON public.user_purchases;
CREATE POLICY "Users can equip own items" ON public.user_purchases
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coin transactions log
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount integer NOT NULL,        -- positive = earned, negative = spent
  reason text NOT NULL,           -- 'game_win', 'daily_login', 'purchase', 'achievement'
  reference_id text,              -- optional: game session ID, item ID, etc.
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions" ON public.coin_transactions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.coin_transactions;
CREATE POLICY "Users can insert own transactions" ON public.coin_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- ============================================================
-- DONE! New tables created:
-- Events:  events, event_rsvps, event_categories, event_reminders
-- Games:   game_stats, store_items, user_purchases, coin_transactions
-- Fixes:   Users can now UPDATE own business_listings
--          Anyone can view APPROVED business_listings
-- ============================================================
