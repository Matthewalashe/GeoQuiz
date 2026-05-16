-- ============================================
-- Wanda CMS — Full Database Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 0. PROFILES TABLE (must exist before anything else)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text,
  full_name text,
  avatar_url text DEFAULT '🧭',
  role text DEFAULT 'user',
  total_xp integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  level integer DEFAULT 1,
  achievements text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧭'),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add role column if missing (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'donghinny91@gmail.com' LIMIT 1);

-- 1. CMS LISTINGS
CREATE TABLE IF NOT EXISTS cms_listings (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  area text,
  price_range text,
  rating numeric(3,1) DEFAULT 0,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  hours text,
  lat numeric(10,6),
  lng numeric(10,6),
  description text,
  tags text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_listings" ON cms_listings;
CREATE POLICY "anon_read_listings" ON cms_listings FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "admin_all_listings" ON cms_listings;
CREATE POLICY "admin_all_listings" ON cms_listings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE INDEX IF NOT EXISTS idx_listings_cat ON cms_listings (category);

-- 2. CMS DEALS
CREATE TABLE IF NOT EXISTS cms_deals (
  id text PRIMARY KEY,
  business text NOT NULL,
  category text NOT NULL,
  category_label text,
  location text,
  lat numeric(10,6),
  lng numeric(10,6),
  offer text NOT NULL,
  mechanic text DEFAULT 'show_screen',
  quest_unlock text,
  description text,
  expiry date,
  badge text,
  color text DEFAULT '#0ea5e9',
  sponsor boolean DEFAULT false,
  featured boolean DEFAULT false,
  image text,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_deals" ON cms_deals;
CREATE POLICY "anon_read_deals" ON cms_deals FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "admin_all_deals" ON cms_deals;
CREATE POLICY "admin_all_deals" ON cms_deals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3. CMS SPONSORS
CREATE TABLE IF NOT EXISTS cms_sponsors (
  id text PRIMARY KEY,
  question_ids text[] DEFAULT '{}',
  brand text NOT NULL,
  icon text,
  logo text,
  message text,
  cta text,
  url text,
  tier text DEFAULT 'bronze',
  active boolean DEFAULT true,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_sponsors" ON cms_sponsors;
CREATE POLICY "anon_read_sponsors" ON cms_sponsors FOR SELECT USING (active = true AND status = 'published');
DROP POLICY IF EXISTS "admin_all_sponsors" ON cms_sponsors;
CREATE POLICY "admin_all_sponsors" ON cms_sponsors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. CMS DISCOVERY
CREATE TABLE IF NOT EXISTS cms_discovery (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  lat numeric(10,6),
  lng numeric(10,6),
  area text,
  rating numeric(3,1) DEFAULT 0,
  description text,
  sponsored boolean DEFAULT false,
  cta text DEFAULT 'Get Directions',
  map_url text,
  image text,
  images text[] DEFAULT '{}',
  logo text,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_discovery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_discovery" ON cms_discovery;
CREATE POLICY "anon_read_discovery" ON cms_discovery FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "admin_all_discovery" ON cms_discovery;
CREATE POLICY "admin_all_discovery" ON cms_discovery FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 5. CMS QUESTIONS
CREATE TABLE IF NOT EXISTS cms_questions (
  id text PRIMARY KEY,
  category text NOT NULL,
  category_label text,
  difficulty text DEFAULT 'beginner',
  region text DEFAULT 'lagos',
  question text NOT NULL,
  hint text,
  answer_lat numeric(10,6),
  answer_lng numeric(10,6),
  answer_name text,
  answer_description text,
  fun_fact text,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_questions" ON cms_questions;
CREATE POLICY "anon_read_questions" ON cms_questions FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "admin_all_questions" ON cms_questions;
CREATE POLICY "admin_all_questions" ON cms_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE INDEX IF NOT EXISTS idx_q_cat ON cms_questions (category);
CREATE INDEX IF NOT EXISTS idx_q_region ON cms_questions (region);

-- 6. CMS CONFIG
CREATE TABLE IF NOT EXISTS cms_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_config" ON cms_config;
CREATE POLICY "anon_read_config" ON cms_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_all_config" ON cms_config;
CREATE POLICY "admin_all_config" ON cms_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

INSERT INTO cms_config (key, value) VALUES
  ('site_name', '"Wanda"'),
  ('site_tagline', '"Experience Nigeria"'),
  ('contact_email', '"donghinny91@gmail.com"'),
  ('features', '{"deals":true,"discovery":true,"community":true,"explore":true}')
ON CONFLICT (key) DO NOTHING;

-- 7. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-uploads', 'cms-uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_view_cms" ON storage.objects;
CREATE POLICY "public_view_cms" ON storage.objects FOR SELECT USING (bucket_id = 'cms-uploads');
DROP POLICY IF EXISTS "admin_upload_cms" ON storage.objects;
CREATE POLICY "admin_upload_cms" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cms-uploads' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "admin_delete_cms" ON storage.objects;
CREATE POLICY "admin_delete_cms" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cms-uploads' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
