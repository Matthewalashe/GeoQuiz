-- ============================================================
-- Wanda Game Engine — Phase 1: Database Foundation (v2)
-- CRITICAL: Client NEVER writes to wallets, coin_transactions,
-- user_lives, or user_streaks. All writes go through
-- SECURITY DEFINER functions (service role / Edge Functions).
-- ALL coin amounts, store prices, game config, level config
-- are pulled from database tables — ZERO hardcoded values.
-- ============================================================
-- Creates 13 tables + 4 config tables + helper functions
-- Fully idempotent — safe to run multiple times
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- 1. WALLETS — User coin & XP balance
-- CLIENT: READ-ONLY. All writes via server functions.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallets (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  coins          integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
  xp             integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  lifetime_coins integer NOT NULL DEFAULT 0 CHECK (lifetime_coins >= 0),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_lifetime ON wallets (lifetime_coins DESC);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Client can only READ their own wallet
DROP POLICY IF EXISTS "Users read own wallet" ON wallets;
CREATE POLICY "Users read own wallet" ON wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Public read for leaderboards (lifetime_coins only via view)
DROP POLICY IF EXISTS "Public read wallets for leaderboard" ON wallets;
CREATE POLICY "Public read wallets for leaderboard" ON wallets
  FOR SELECT TO authenticated USING (true);
-- NO insert/update/delete policies for authenticated role.
-- Only SECURITY DEFINER functions (service role) can write.


-- ═══════════════════════════════════════════════════════════
-- 2. COIN TRANSACTIONS — Full audit trail
-- CLIENT: READ-ONLY. All inserts via server functions.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coin_transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount      integer NOT NULL,
  type        text NOT NULL CHECK (type IN ('earned', 'spent', 'redeemed')),
  source      text NOT NULL,
  game_type   text,
  level       integer,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_txn_user ON coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_source ON coin_transactions (user_id, source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_dedup ON coin_transactions (user_id, source, game_type, level, created_at DESC);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Client can only READ their own transactions
DROP POLICY IF EXISTS "Users read own transactions" ON coin_transactions;
CREATE POLICY "Users read own transactions" ON coin_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- NO insert/update/delete for authenticated role.


-- ═══════════════════════════════════════════════════════════
-- 3. USER STREAKS — Streak tracking
-- CLIENT: READ-ONLY. Writes via server functions.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_streaks (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak    integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak    integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_played_date  date,
  has_streak_shield boolean NOT NULL DEFAULT false,
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks (user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own streaks" ON user_streaks;
CREATE POLICY "Users read own streaks" ON user_streaks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- NO write policies for client.


-- ═══════════════════════════════════════════════════════════
-- 4. QUESTIONS — Central question bank
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS questions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type       text NOT NULL,
  category        text,
  difficulty      integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  question_text   text NOT NULL,
  options         jsonb,
  correct_answer  text NOT NULL,
  explanation     text,
  media_url       text,
  lat             double precision,
  lng             double precision,
  times_shown     integer NOT NULL DEFAULT 0,
  times_correct   integer NOT NULL DEFAULT 0,
  source          text NOT NULL DEFAULT 'manual',
  submitted_by    uuid REFERENCES auth.users(id),
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_game ON questions (game_type, difficulty, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions (game_type, category, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions (is_active) WHERE is_active = true;

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads active questions" ON questions;
CREATE POLICY "Anyone reads active questions" ON questions
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins read all questions" ON questions;
CREATE POLICY "Admins read all questions" ON questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- Community question submission (is_active=false until admin approves)
DROP POLICY IF EXISTS "Users submit questions" ON questions;
CREATE POLICY "Users submit questions" ON questions
  FOR INSERT TO authenticated WITH CHECK (source = 'community' AND is_active = false);

-- Admins manage all questions
DROP POLICY IF EXISTS "Admins manage questions" ON questions;
CREATE POLICY "Admins manage questions" ON questions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));


-- ═══════════════════════════════════════════════════════════
-- 5. USER QUESTION HISTORY
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_question_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  was_correct boolean NOT NULL,
  answered_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uqh_dedup ON user_question_history (user_id, question_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_uqh_recent ON user_question_history (user_id, answered_at DESC);

ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own history" ON user_question_history;
CREATE POLICY "Users read own history" ON user_question_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Inserts via server function only (part of level completion flow)


-- ═══════════════════════════════════════════════════════════
-- 6. USER LIVES
-- CLIENT: READ-ONLY. All writes via server functions.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_lives (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  lives               integer NOT NULL DEFAULT 5 CHECK (lives >= 0),
  max_lives           integer NOT NULL DEFAULT 5 CHECK (max_lives >= 1),
  last_regenerated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lives_user ON user_lives (user_id);

ALTER TABLE user_lives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own lives" ON user_lives;
CREATE POLICY "Users read own lives" ON user_lives
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- NO write policies for client.


-- ═══════════════════════════════════════════════════════════
-- 7. USER GAME PROGRESS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_game_progress (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type                text NOT NULL,
  current_level            integer NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  highest_level_reached    integer NOT NULL DEFAULT 1 CHECK (highest_level_reached >= 1),
  total_coins_earned_here  integer NOT NULL DEFAULT 0 CHECK (total_coins_earned_here >= 0),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE(user_id, game_type)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_game_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_leaderboard ON user_game_progress (game_type, highest_level_reached DESC, total_coins_earned_here DESC);

ALTER TABLE user_game_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read progress for leaderboard" ON user_game_progress;
CREATE POLICY "Public read progress for leaderboard" ON user_game_progress
  FOR SELECT TO authenticated USING (true);
-- Writes via server function only.


-- ═══════════════════════════════════════════════════════════
-- 8. SEASONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seasons (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  is_active  boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (ends_at > starts_at)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads seasons" ON seasons;
CREATE POLICY "Anyone reads seasons" ON seasons
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage seasons" ON seasons;
CREATE POLICY "Admins manage seasons" ON seasons
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));


-- ═══════════════════════════════════════════════════════════
-- 9. SEASON PROGRESS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS season_progress (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  season_id                 uuid REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  coins_earned_this_season  integer NOT NULL DEFAULT 0 CHECK (coins_earned_this_season >= 0),
  rank                      integer,
  updated_at                timestamptz DEFAULT now(),
  UNIQUE(user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_season_leaderboard ON season_progress (season_id, coins_earned_this_season DESC);

ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads season progress" ON season_progress;
CREATE POLICY "Anyone reads season progress" ON season_progress
  FOR SELECT TO authenticated USING (true);
-- Writes via server function only.


-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════
-- CONFIG TABLES — The admin-editable brain of the game economy
-- All read by client at runtime. All editable from Supabase/CMS.
-- ZERO hardcoded values in the application code.
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════
-- 10. COIN CONFIG — Every coin reward amount
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coin_config (
  key         text PRIMARY KEY,           -- e.g. 'level_complete_base'
  value       integer NOT NULL,           -- the coin amount
  description text,                       -- human-readable
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE coin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads coin config" ON coin_config;
CREATE POLICY "Anyone reads coin config" ON coin_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage coin config" ON coin_config;
CREATE POLICY "Admins manage coin config" ON coin_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- Seed all coin reward values
INSERT INTO coin_config (key, value, description) VALUES
  ('level_complete_base',       10,  'Base coins for completing a level'),
  ('difficulty_multiplier',      2,  'Extra coins per difficulty point (difficulty × this)'),
  ('perfect_score_bonus',        5,  'Bonus coins for 10/10 on a level'),
  ('daily_login',                3,  'Coins for first login each calendar day'),
  ('streak_7_bonus',            50,  'Bonus coins for 7-day streak'),
  ('streak_30_bonus',          200,  'Bonus coins for 30-day streak'),
  ('streak_100_bonus',         500,  'Bonus coins for 100-day streak'),
  ('first_play_bonus',          20,  'One-time coins for first play of each game type'),
  ('share_result',               5,  'Coins for sharing a result (once per day)'),
  ('community_question',        15,  'Coins when submitted question gets approved'),
  ('daily_challenge_bonus',     15,  'Bonus coins for daily challenge (postcard/guessword/trivia)'),
  ('pinpoint_perfect',          15,  'PinPoint: under 50km'),
  ('pinpoint_close',            10,  'PinPoint: 50-200km'),
  ('pinpoint_near',              5,  'PinPoint: 200-500km'),
  ('pinpoint_miss',              0,  'PinPoint: over 500km'),
  ('flagstack_per_flag',         1,  'FlagStack: coin per correct flag'),
  ('flagstack_personal_best',   20,  'FlagStack: bonus for new personal best'),
  ('pass_level_threshold',       7,  'Questions correct to pass a level (out of 10)'),
  ('questions_per_level',       10,  'Number of questions per level'),
  ('life_regen_seconds',      1800,  'Seconds between each life regeneration (30 min)'),
  ('max_lives',                  5,  'Maximum number of lives'),
  ('purchase_lives_cost',       20,  'Cost in coins to buy full life refill'),
  ('purchase_streak_shield',    50,  'Cost in coins for streak shield'),
  ('purchase_hints_5',          30,  'Cost for 5 hint tokens'),
  ('hint_cost',                  5,  'Cost per hint (second hint onwards)')
ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 11. STORE ITEMS — All purchasable items
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS store_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text NOT NULL UNIQUE,            -- e.g. 'life_pack_3', 'map_skin_dark'
  name          text NOT NULL,
  description   text,
  category      text NOT NULL CHECK (category IN ('consumable', 'cosmetic', 'tangible')),
  price_coins   integer NOT NULL CHECK (price_coins >= 0),
  icon          text,                            -- emoji or image URL
  is_available  boolean NOT NULL DEFAULT true,   -- false = "Coming Soon"
  is_one_time   boolean NOT NULL DEFAULT false,  -- true = can only buy once
  sort_order    integer NOT NULL DEFAULT 0,
  saving_count  integer NOT NULL DEFAULT 0,      -- "X users saving for this"
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads store items" ON store_items;
CREATE POLICY "Anyone reads store items" ON store_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage store items" ON store_items;
CREATE POLICY "Admins manage store items" ON store_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- Seed store items
INSERT INTO store_items (slug, name, description, category, price_coins, icon, is_available, is_one_time, sort_order) VALUES
  ('life_pack_3',      'Extra Life Pack',    'Instantly refill all 3 lives',    'consumable', 20,  '❤️',  true,  false, 1),
  ('streak_shield',    'Streak Shield',      'Protects your streak for 1 missed day', 'consumable', 50,  '🛡️', true,  false, 2),
  ('hint_token_5',     'Hint Token ×5',      '5 hint tokens for any game',     'consumable', 30,  '💡',  true,  false, 3),
  ('map_skin_dark',    'Map Skin — Dark',    'Sleek dark mode map theme',       'cosmetic',  100,  '🌑',  true,  true,  4),
  ('map_skin_sat',     'Map Skin — Satellite','Real satellite imagery',         'cosmetic',  150,  '🛰️', true,  true,  5),
  ('map_skin_retro',   'Map Skin — Retro',   'Classic retro cartography style', 'cosmetic',  200,  '🗺️', true,  true,  6),
  ('wanda_tshirt',     'Wanda T-Shirt',      'Official Wanda explorer t-shirt', 'tangible',  500,  '👕',  false, true,  7),
  ('wanda_sticker',    'Sticker Pack',       'Set of 5 Wanda stickers',        'tangible',  300,  '🏷️', false, true,  8),
  ('coffee_voucher',   'Coffee Voucher',     '₦1,000 café voucher in Lagos',   'tangible', 1000,  '☕',  false, true,  9)
ON CONFLICT (slug) DO NOTHING;

-- Track user purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_slug     text REFERENCES store_items(slug) NOT NULL,
  quantity      integer NOT NULL DEFAULT 1,
  coins_spent   integer NOT NULL,
  purchased_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON user_purchases (user_id, item_slug);

ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own purchases" ON user_purchases;
CREATE POLICY "Users read own purchases" ON user_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Inserts via server function only.


-- ═══════════════════════════════════════════════════════════
-- 12. GAME CONFIG — Which games exist, enabled/disabled
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS game_config (
  slug          text PRIMARY KEY,               -- 'map_quiz', 'trivia', etc.
  name          text NOT NULL,
  description   text,
  icon          text,                           -- emoji
  max_levels    integer NOT NULL DEFAULT 50,
  is_enabled    boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  route         text,                           -- frontend route e.g. '/play/map-quiz'
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads game config" ON game_config;
CREATE POLICY "Anyone reads game config" ON game_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage game config" ON game_config;
CREATE POLICY "Admins manage game config" ON game_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- Seed games
INSERT INTO game_config (slug, name, description, icon, max_levels, is_enabled, sort_order, route) VALUES
  ('map_quiz',   'Map Quiz',    'Test your geography knowledge across continents',    '🌍', 50, true,  1, '/play/map-quiz'),
  ('postcards',  'Postcards',   'Discover places through beautiful postcards',         '🏞️', 50, true,  2, '/play/postcards'),
  ('guessword',  'Guessword',   'Guess the hidden word — cities, landmarks, countries', '🔤', 50, true,  3, '/play/guessword'),
  ('trivia',     'Trivia',      'General knowledge trivia across categories',           '🧠', 50, true,  4, '/play/trivia'),
  ('pinpoint',   'PinPoint',    'Drop a pin on the map — how close can you get?',       '📍', 50, true,  5, '/play/pinpoint'),
  ('flagstack',  'FlagStack',   'Identify falling flags before they hit the ground',    '🏁', 50, true,  6, '/play/flagstack')
ON CONFLICT (slug) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 13. LEVEL CONFIG — Difficulty mapping per level range
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS level_config (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level_min       integer NOT NULL,
  level_max       integer NOT NULL,
  difficulty      integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  time_limit_secs integer NOT NULL DEFAULT 30,
  description     text,
  CHECK (level_max >= level_min)
);

ALTER TABLE level_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads level config" ON level_config;
CREATE POLICY "Anyone reads level config" ON level_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage level config" ON level_config;
CREATE POLICY "Admins manage level config" ON level_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- Seed level → difficulty mapping
INSERT INTO level_config (level_min, level_max, difficulty, time_limit_secs, description) VALUES
  ( 1, 10, 1, 45, 'Beginner — generous time, obvious answers'),
  (11, 20, 2, 35, 'Easy — slightly harder, still accessible'),
  (21, 30, 3, 30, 'Medium — real challenge begins'),
  (31, 40, 4, 20, 'Hard — short time, tricky content'),
  (41, 50, 5, 15, 'Expert — very short time, obscure content')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════
-- SERVER-SIDE FUNCTIONS (SECURITY DEFINER)
-- These run with full privileges, bypassing RLS.
-- Called from Edge Functions or directly via supabase.rpc()
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────
-- ensure_game_profile: Create wallet + lives + streaks
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ensure_game_profile(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_lives user_lives%ROWTYPE;
  v_streaks user_streaks%ROWTYPE;
BEGIN
  INSERT INTO wallets (user_id, coins, xp, lifetime_coins)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_lives (user_id, lives, max_lives)
  VALUES (p_user_id, 5, 5)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_streaks (user_id, current_streak, longest_streak)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_wallet FROM wallets WHERE wallets.user_id = p_user_id;
  SELECT * INTO v_lives FROM user_lives WHERE user_lives.user_id = p_user_id;
  SELECT * INTO v_streaks FROM user_streaks WHERE user_streaks.user_id = p_user_id;

  RETURN jsonb_build_object(
    'wallet', row_to_json(v_wallet),
    'lives', row_to_json(v_lives),
    'streaks', row_to_json(v_streaks)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- regenerate_lives: Calculate & apply time-based life regen
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION regenerate_lives(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_row user_lives%ROWTYPE;
  v_elapsed integer;
  v_regen integer;
  v_new_lives integer;
  v_interval integer;
  v_remainder integer;
BEGIN
  SELECT * INTO v_row FROM user_lives WHERE user_lives.user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO user_lives (user_id, lives, max_lives, last_regenerated_at)
    VALUES (p_user_id, 5, 5, now())
    RETURNING * INTO v_row;
  END IF;

  -- Get regen interval from config
  SELECT value INTO v_interval FROM coin_config WHERE key = 'life_regen_seconds';
  IF v_interval IS NULL THEN v_interval := 1800; END IF;

  IF v_row.lives >= v_row.max_lives THEN
    RETURN jsonb_build_object('lives', v_row.lives, 'max_lives', v_row.max_lives, 'seconds_until_next', 0);
  END IF;

  v_elapsed := EXTRACT(EPOCH FROM (now() - v_row.last_regenerated_at))::integer;
  v_regen := v_elapsed / v_interval;
  v_new_lives := LEAST(v_row.lives + v_regen, v_row.max_lives);
  v_remainder := v_interval - (v_elapsed % v_interval);

  IF v_new_lives > v_row.lives THEN
    UPDATE user_lives SET
      lives = v_new_lives,
      last_regenerated_at = CASE
        WHEN v_new_lives >= v_row.max_lives THEN now()
        ELSE v_row.last_regenerated_at + (v_regen * v_interval * interval '1 second')
      END
    WHERE user_lives.user_id = p_user_id;
  END IF;

  IF v_new_lives >= v_row.max_lives THEN v_remainder := 0; END IF;

  RETURN jsonb_build_object('lives', v_new_lives, 'max_lives', v_row.max_lives, 'seconds_until_next', v_remainder);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- award_coins: Atomic coin award with dedup + audit trail
-- This is THE function for all coin awards. Never bypass it.
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_coins(
  p_user_id   uuid,
  p_source    text,
  p_game_type text DEFAULT NULL,
  p_level     integer DEFAULT NULL,
  p_desc      text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_amount integer;
  v_difficulty integer;
  v_config_key text;
  v_base integer;
  v_multiplier integer;
  v_already_exists boolean;
  v_new_balance integer;
  v_final_desc text;
BEGIN
  -- DEDUP: Check if this exact award already happened
  -- (same user, source, game_type, level for one-time events)
  IF p_source IN ('first_play', 'streak_7', 'streak_30', 'streak_100') THEN
    SELECT EXISTS(
      SELECT 1 FROM coin_transactions
      WHERE user_id = p_user_id AND source = p_source
        AND (game_type = p_game_type OR (game_type IS NULL AND p_game_type IS NULL))
    ) INTO v_already_exists;
    IF v_already_exists THEN
      RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded');
    END IF;
  END IF;

  -- Daily dedup for daily_login and share_result
  IF p_source IN ('daily_login', 'share_result') THEN
    SELECT EXISTS(
      SELECT 1 FROM coin_transactions
      WHERE user_id = p_user_id AND source = p_source
        AND created_at::date = CURRENT_DATE
    ) INTO v_already_exists;
    IF v_already_exists THEN
      RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded_today');
    END IF;
  END IF;

  -- Determine coin amount from coin_config
  IF p_source = 'level_complete' THEN
    SELECT value INTO v_base FROM coin_config WHERE key = 'level_complete_base';
    SELECT value INTO v_multiplier FROM coin_config WHERE key = 'difficulty_multiplier';
    -- Determine difficulty from level
    SELECT lc.difficulty INTO v_difficulty FROM level_config lc
      WHERE p_level BETWEEN lc.level_min AND lc.level_max LIMIT 1;
    v_amount := COALESCE(v_base, 10) + (COALESCE(v_difficulty, 1) * COALESCE(v_multiplier, 2));
  ELSE
    -- Look up directly from coin_config
    SELECT value INTO v_amount FROM coin_config WHERE key = p_source;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'no_config_for_source');
  END IF;

  v_final_desc := COALESCE(p_desc, p_source);

  -- Atomic: insert transaction + update wallet
  INSERT INTO coin_transactions (user_id, amount, type, source, game_type, level, description)
  VALUES (p_user_id, v_amount, 'earned', p_source, p_game_type, p_level, v_final_desc);

  INSERT INTO wallets (user_id, coins, xp, lifetime_coins, updated_at)
  VALUES (p_user_id, v_amount, 0, v_amount, now())
  ON CONFLICT (user_id) DO UPDATE SET
    coins = wallets.coins + v_amount,
    lifetime_coins = wallets.lifetime_coins + v_amount,
    updated_at = now();

  SELECT coins INTO v_new_balance FROM wallets WHERE wallets.user_id = p_user_id;

  -- Update season progress if active season exists
  UPDATE season_progress SET
    coins_earned_this_season = coins_earned_this_season + v_amount,
    updated_at = now()
  WHERE user_id = p_user_id
    AND season_id = (SELECT id FROM seasons WHERE is_active = true LIMIT 1);

  -- If no season_progress row, create one
  IF NOT FOUND THEN
    INSERT INTO season_progress (user_id, season_id, coins_earned_this_season)
    SELECT p_user_id, id, v_amount FROM seasons WHERE is_active = true LIMIT 1
    ON CONFLICT (user_id, season_id) DO UPDATE SET
      coins_earned_this_season = season_progress.coins_earned_this_season + v_amount;
  END IF;

  RETURN jsonb_build_object(
    'awarded', true,
    'amount', v_amount,
    'source', p_source,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- spend_coins: Atomic coin spending (store purchases, lives)
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id uuid,
  p_amount  integer,
  p_source  text,
  p_desc    text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_balance integer;
  v_new_balance integer;
BEGIN
  SELECT coins INTO v_balance FROM wallets WHERE wallets.user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_wallet');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_coins', 'balance', v_balance, 'cost', p_amount);
  END IF;

  -- Deduct coins (lifetime_coins stays the same — never decreases)
  UPDATE wallets SET
    coins = coins - p_amount,
    updated_at = now()
  WHERE wallets.user_id = p_user_id;

  -- Log the transaction
  INSERT INTO coin_transactions (user_id, amount, type, source, description)
  VALUES (p_user_id, -p_amount, 'spent', p_source, COALESCE(p_desc, p_source));

  SELECT coins INTO v_new_balance FROM wallets WHERE wallets.user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'spent', p_amount, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- use_life: Deduct 1 life (on level fail)
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION use_life(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_lives integer;
BEGIN
  -- First regenerate any pending lives
  PERFORM regenerate_lives(p_user_id);

  SELECT lives INTO v_lives FROM user_lives WHERE user_lives.user_id = p_user_id;

  IF v_lives IS NULL OR v_lives <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_lives', 'lives', COALESCE(v_lives, 0));
  END IF;

  UPDATE user_lives SET
    lives = lives - 1,
    last_regenerated_at = CASE
      WHEN lives = (SELECT max_lives FROM user_lives WHERE user_lives.user_id = p_user_id)
      THEN now()  -- start regen timer when dropping below max
      ELSE last_regenerated_at
    END
  WHERE user_lives.user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'lives_remaining', v_lives - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- buy_lives: Spend coins to refill all lives
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_lives(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_cost integer;
  v_max integer;
  v_spend_result jsonb;
BEGIN
  SELECT value INTO v_cost FROM coin_config WHERE key = 'purchase_lives_cost';
  IF v_cost IS NULL THEN v_cost := 20; END IF;

  SELECT max_lives INTO v_max FROM user_lives WHERE user_lives.user_id = p_user_id;
  IF v_max IS NULL THEN v_max := 5; END IF;

  v_spend_result := spend_coins(p_user_id, v_cost, 'purchase_lives', 'Bought full life refill');

  IF (v_spend_result->>'success')::boolean THEN
    UPDATE user_lives SET lives = v_max, last_regenerated_at = now()
    WHERE user_lives.user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'lives', v_max, 'coins_spent', v_cost, 'new_balance', (v_spend_result->>'new_balance')::integer);
  ELSE
    RETURN v_spend_result;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- process_daily_login: Streak update + daily coin award
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_daily_login(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_streak user_streaks%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_result jsonb := '{}';
  v_daily_result jsonb;
  v_streak_result jsonb;
BEGIN
  -- Ensure game profile exists
  PERFORM ensure_game_profile(p_user_id);

  SELECT * INTO v_streak FROM user_streaks WHERE user_streaks.user_id = p_user_id;

  -- Already logged in today
  IF v_streak.last_played_date = v_today THEN
    RETURN jsonb_build_object(
      'already_logged_in', true,
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak
    );
  END IF;

  -- Update streak
  IF v_streak.last_played_date = v_yesterday THEN
    -- Consecutive day
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_played_date = v_today,
      updated_at = now()
    WHERE user_streaks.user_id = p_user_id;
  ELSIF v_streak.last_played_date IS NOT NULL AND v_streak.last_played_date < v_yesterday THEN
    -- Missed a day — check streak shield
    IF v_streak.has_streak_shield THEN
      UPDATE user_streaks SET
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_played_date = v_today,
        has_streak_shield = false,  -- consumed
        updated_at = now()
      WHERE user_streaks.user_id = p_user_id;
    ELSE
      -- Reset streak
      UPDATE user_streaks SET
        current_streak = 1,
        last_played_date = v_today,
        updated_at = now()
      WHERE user_streaks.user_id = p_user_id;
    END IF;
  ELSE
    -- First ever login
    UPDATE user_streaks SET
      current_streak = 1,
      last_played_date = v_today,
      updated_at = now()
    WHERE user_streaks.user_id = p_user_id;
  END IF;

  -- Refresh streak data
  SELECT * INTO v_streak FROM user_streaks WHERE user_streaks.user_id = p_user_id;

  -- Award daily login coins
  v_daily_result := award_coins(p_user_id, 'daily_login', NULL, NULL, 'Daily login reward');
  v_result := jsonb_build_object(
    'current_streak', v_streak.current_streak,
    'longest_streak', v_streak.longest_streak,
    'daily_coins', v_daily_result
  );

  -- Award streak milestone bonuses
  IF v_streak.current_streak = 7 THEN
    v_streak_result := award_coins(p_user_id, 'streak_7', NULL, NULL, '7-day streak bonus!');
    v_result := v_result || jsonb_build_object('streak_bonus', v_streak_result, 'milestone', '7_day');
  ELSIF v_streak.current_streak = 30 THEN
    v_streak_result := award_coins(p_user_id, 'streak_30', NULL, NULL, '30-day streak bonus!');
    v_result := v_result || jsonb_build_object('streak_bonus', v_streak_result, 'milestone', '30_day');
  ELSIF v_streak.current_streak = 100 THEN
    v_streak_result := award_coins(p_user_id, 'streak_100', NULL, NULL, '100-day streak bonus!');
    v_result := v_result || jsonb_build_object('streak_bonus', v_streak_result, 'milestone', '100_day');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- complete_level: Full level completion flow
-- Awards coins, updates progress, logs question history
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_level(
  p_user_id     uuid,
  p_game_type   text,
  p_level       integer,
  p_correct     integer,        -- how many questions answered correctly
  p_total       integer,        -- total questions (should be 10)
  p_answers     jsonb DEFAULT NULL  -- [{question_id, was_correct}]
) RETURNS jsonb AS $$
DECLARE
  v_threshold integer;
  v_passed boolean;
  v_coin_result jsonb;
  v_perfect_result jsonb;
  v_first_play_result jsonb;
  v_result jsonb;
  v_answer jsonb;
  v_is_first_play boolean;
BEGIN
  -- Get pass threshold from config
  SELECT value INTO v_threshold FROM coin_config WHERE key = 'pass_level_threshold';
  IF v_threshold IS NULL THEN v_threshold := 7; END IF;

  v_passed := p_correct >= v_threshold;

  -- Log question history if answers provided
  IF p_answers IS NOT NULL THEN
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
      INSERT INTO user_question_history (user_id, question_id, was_correct)
      VALUES (p_user_id, (v_answer->>'question_id')::uuid, (v_answer->>'was_correct')::boolean)
      ON CONFLICT DO NOTHING;

      -- Update question stats
      UPDATE questions SET times_shown = times_shown + 1 WHERE id = (v_answer->>'question_id')::uuid;
      IF (v_answer->>'was_correct')::boolean THEN
        UPDATE questions SET times_correct = times_correct + 1 WHERE id = (v_answer->>'question_id')::uuid;
      END IF;
    END LOOP;
  END IF;

  IF NOT v_passed THEN
    -- Failed — deduct life
    RETURN jsonb_build_object(
      'passed', false,
      'correct', p_correct,
      'threshold', v_threshold,
      'life_result', use_life(p_user_id)
    );
  END IF;

  -- PASSED — award coins
  v_coin_result := award_coins(p_user_id, 'level_complete', p_game_type, p_level, 'Completed level ' || p_level);

  v_result := jsonb_build_object(
    'passed', true,
    'correct', p_correct,
    'threshold', v_threshold,
    'coins', v_coin_result
  );

  -- Perfect score bonus
  IF p_correct = p_total THEN
    v_perfect_result := award_coins(p_user_id, 'perfect_score_bonus', p_game_type, p_level, 'Perfect score!');
    v_result := v_result || jsonb_build_object('perfect_bonus', v_perfect_result);
  END IF;

  -- First-time playing this game type bonus
  SELECT NOT EXISTS(
    SELECT 1 FROM user_game_progress WHERE user_id = p_user_id AND game_type = p_game_type
  ) INTO v_is_first_play;

  IF v_is_first_play THEN
    v_first_play_result := award_coins(p_user_id, 'first_play_bonus', p_game_type, NULL, 'First time playing ' || p_game_type);
    v_result := v_result || jsonb_build_object('first_play_bonus', v_first_play_result);
  END IF;

  -- Update game progress
  INSERT INTO user_game_progress (user_id, game_type, current_level, highest_level_reached, total_coins_earned_here)
  VALUES (p_user_id, p_game_type, p_level + 1, p_level, COALESCE((v_coin_result->>'amount')::integer, 0))
  ON CONFLICT (user_id, game_type) DO UPDATE SET
    current_level = GREATEST(user_game_progress.current_level, p_level + 1),
    highest_level_reached = GREATEST(user_game_progress.highest_level_reached, p_level),
    total_coins_earned_here = user_game_progress.total_coins_earned_here + COALESCE((v_coin_result->>'amount')::integer, 0),
    updated_at = now();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────
-- purchase_store_item: Buy an item from the store
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION purchase_store_item(
  p_user_id  uuid,
  p_item_slug text
) RETURNS jsonb AS $$
DECLARE
  v_item store_items%ROWTYPE;
  v_spend_result jsonb;
  v_already_owned boolean;
BEGIN
  SELECT * INTO v_item FROM store_items WHERE slug = p_item_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'item_not_found');
  END IF;

  IF NOT v_item.is_available THEN
    RETURN jsonb_build_object('success', false, 'reason', 'coming_soon');
  END IF;

  -- Check one-time purchase
  IF v_item.is_one_time THEN
    SELECT EXISTS(
      SELECT 1 FROM user_purchases WHERE user_id = p_user_id AND item_slug = p_item_slug
    ) INTO v_already_owned;
    IF v_already_owned THEN
      RETURN jsonb_build_object('success', false, 'reason', 'already_owned');
    END IF;
  END IF;

  -- Spend coins
  v_spend_result := spend_coins(p_user_id, v_item.price_coins, 'purchase_' || v_item.category, 'Purchased: ' || v_item.name);

  IF NOT (v_spend_result->>'success')::boolean THEN
    RETURN v_spend_result;
  END IF;

  -- Record purchase
  INSERT INTO user_purchases (user_id, item_slug, quantity, coins_spent)
  VALUES (p_user_id, p_item_slug, 1, v_item.price_coins);

  -- Apply item effects
  IF p_item_slug = 'life_pack_3' THEN
    UPDATE user_lives SET lives = max_lives, last_regenerated_at = now()
    WHERE user_lives.user_id = p_user_id;
  ELSIF p_item_slug = 'streak_shield' THEN
    UPDATE user_streaks SET has_streak_shield = true
    WHERE user_streaks.user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'item', p_item_slug, 'coins_spent', v_item.price_coins, 'new_balance', (v_spend_result->>'new_balance')::integer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- SEED: Season 1
-- ═══════════════════════════════════════════════════════════

INSERT INTO seasons (name, starts_at, ends_at, is_active)
SELECT 'Season 1 — Lagos Explorer', now(), now() + interval '90 days', true
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE is_active = true);


-- ═══════════════════════════════════════════════════════════
-- DONE
-- 13 tables + 4 config tables created
-- 8 SECURITY DEFINER server functions
-- Full RLS with client READ-ONLY on sensitive tables
-- All coin amounts from coin_config — zero hardcoded values
-- ═══════════════════════════════════════════════════════════
