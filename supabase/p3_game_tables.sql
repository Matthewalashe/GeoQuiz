-- ============================================================
-- P3: Game Content Tables for Wanda / GeoQuiz
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. TRIVIA PACKS
-- Stores trivia questions grouped by pack (lagos, nigeria, culture)
CREATE TABLE IF NOT EXISTS cms_trivia_packs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id text NOT NULL,           -- 'lagos', 'nigeria', 'culture'
  label text NOT NULL,             -- '🌊 Lagos Life'
  description text,                -- 'Bridges, buses, markets & neighborhoods'
  color text DEFAULT '#0ea5e9',
  question text NOT NULL,          -- The question text
  options jsonb NOT NULL,          -- ["Option A", "Option B", "Option C", "Option D"]
  answer_index int NOT NULL,       -- 0-based index of correct answer
  fact text,                       -- Fun fact shown after answering
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. CROSSWORD PUZZLES
-- Each puzzle has metadata + clues stored as JSONB
CREATE TABLE IF NOT EXISTS cms_crosswords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  puzzle_id text NOT NULL UNIQUE,  -- 'lagos', 'culture', 'nigeria', etc.
  label text NOT NULL,             -- '🌊 Lagos Icons'
  description text,
  color text DEFAULT '#0ea5e9',
  grid_size int DEFAULT 5,
  across jsonb NOT NULL,           -- [{num, text, answer, row, col}, ...]
  down jsonb NOT NULL,             -- [{num, text, answer, row, col}, ...]
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. WORD GAME
-- Each word entry with clue, category, description, history
CREATE TABLE IF NOT EXISTS cms_wordgame (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id text NOT NULL UNIQUE,    -- 'gw-01'
  word text NOT NULL,              -- 'BADAGRY'
  clue text NOT NULL,              -- 'Coastal town with a dark slave trade history'
  category text,                   -- 'Place', 'Kingdom', 'Person', etc.
  image text,                      -- '/images/postcards/badagry.png'
  description text,                -- Rich description
  history jsonb,                   -- ["paragraph1", "paragraph2", ...]
  footnotes jsonb,                 -- ["footnote1", "footnote2", ...]
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. POSTCARDS (Visual Guess questions)
-- Photo-based quiz questions with multiple packs
CREATE TABLE IF NOT EXISTS cms_postcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  postcard_id text NOT NULL UNIQUE, -- 'vg-01'
  pack text NOT NULL DEFAULT 'visual', -- 'visual', 'cultural', 'hyperlocal'
  image text,                       -- '/images/postcards/...'
  question text NOT NULL,
  options jsonb NOT NULL,           -- ["Option A", "Option B", ...]
  correct_index int NOT NULL,       -- 0-based
  category text DEFAULT 'visual',   -- 'visual', 'cultural', 'hyperlocal'
  fact text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. PUZZLE IMAGES
-- Images used for the jigsaw puzzle game
CREATE TABLE IF NOT EXISTS cms_puzzles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  puzzle_id text NOT NULL UNIQUE,
  label text NOT NULL,              -- 'National Theatre'
  image text NOT NULL,              -- '/images/postcards/national-theatre.png'
  difficulty text DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. ADVENTURE STORIES
-- Choose-your-own-adventure with branching nodes stored as JSONB
CREATE TABLE IF NOT EXISTS cms_adventures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id text NOT NULL UNIQUE,   -- 'commute', 'market', 'beach'
  title text NOT NULL,             -- '🚌 Lagos Commute'
  description text,                -- 'Survive the morning rush'
  color text DEFAULT '#eab308',
  start_node text NOT NULL DEFAULT 's',
  nodes jsonb NOT NULL,            -- {s: {text, choices: [{text, next, health, xp}]}, ...}
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. CAMPAIGN CHAPTERS (Story Mode)
-- Progressive campaign chapters with stages
CREATE TABLE IF NOT EXISTS cms_campaign (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id text NOT NULL UNIQUE, -- 'ch-1'
  week int NOT NULL,
  title text NOT NULL,             -- 'Learn the 20 LGAs'
  subtitle text,
  icon text,                       -- '🏛️'
  color text DEFAULT '#00ff88',
  badge text,                      -- 'lga-master'
  badge_emoji text,                -- '🏛️'
  intro text,                      -- Intro paragraph
  category_filter text,            -- 'lgas', 'markets', etc.
  question_count int DEFAULT 10,
  stages jsonb NOT NULL,           -- [{id, name, questions, stars}, ...]
  facts jsonb,                     -- ["fact1", "fact2", ...]
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. COLORING SCENES
-- Metadata only — SVG rendering stays in code (React components)
-- This stores scene metadata so new scenes can be added via CMS
CREATE TABLE IF NOT EXISTS cms_coloring (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id text NOT NULL UNIQUE,   -- 'keke', 'mosque', etc.
  title text NOT NULL,             -- 'Keke Napep'
  description text,                -- 'Color a Lagos tricycle taxi'
  color text DEFAULT '#f97316',
  min_parts int DEFAULT 4,
  guide jsonb,                     -- {body: '#FFD700', roof: '#FF4500', ...}
  parts jsonb NOT NULL,            -- ['body', 'roof', 'window1', ...]
  svg_key text NOT NULL,           -- maps to a React component in code
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY — Public read for all game content
-- ============================================================

ALTER TABLE cms_trivia_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_crosswords ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_wordgame ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_postcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_coloring ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (public) reads
CREATE POLICY "Public read cms_trivia_packs" ON cms_trivia_packs FOR SELECT USING (true);
CREATE POLICY "Public read cms_crosswords" ON cms_crosswords FOR SELECT USING (true);
CREATE POLICY "Public read cms_wordgame" ON cms_wordgame FOR SELECT USING (true);
CREATE POLICY "Public read cms_postcards" ON cms_postcards FOR SELECT USING (true);
CREATE POLICY "Public read cms_puzzles" ON cms_puzzles FOR SELECT USING (true);
CREATE POLICY "Public read cms_adventures" ON cms_adventures FOR SELECT USING (true);
CREATE POLICY "Public read cms_campaign" ON cms_campaign FOR SELECT USING (true);
CREATE POLICY "Public read cms_coloring" ON cms_coloring FOR SELECT USING (true);
