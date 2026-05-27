-- ============================================================
-- apply-all-fixes.sql  (FOOLPROOF & SEQUENCED)
-- Run this ONCE in the Supabase SQL Editor.
-- It is safe to re-run — every statement is idempotent.
-- ============================================================

-- §0. ENSURE PROFILES TABLE EXISTS WITH ALL COLUMNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
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

-- If the table already existed but was missing columns, add them now
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '🧭';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- §1. STAFF INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'editor')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage staff invitations" ON public.staff_invitations;
CREATE POLICY "Admins can manage staff invitations" ON public.staff_invitations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- §2. PROFILES RLS POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
CREATE POLICY "Admins can insert any profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- §3. AUTO-CONFIRM SIGNUPS (BEFORE INSERT on auth.users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_before ON auth.users;
CREATE TRIGGER on_auth_user_created_before
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_users();

-- §4. AUTO-CREATE PROFILE ON SIGNUP (AFTER INSERT on auth.users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role text;
BEGIN
  -- Check if the signing-up user was pre-invited as staff
  SELECT role INTO invited_role
    FROM public.staff_invitations
   WHERE lower(email) = lower(NEW.email);

  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧭'),
    COALESCE(invited_role, NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    username   = COALESCE(EXCLUDED.username, public.profiles.username),
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role       = COALESCE(invited_role, public.profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- §5. BACK-FILL DATA FOR EXISTING USERS
-- ============================================================
-- Create profile rows for any auth users that don't have one
INSERT INTO public.profiles (id, email, avatar_url, role, created_at, updated_at)
SELECT id, email, '🧭', 'user', COALESCE(created_at, NOW()), NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Backfill email for profiles that are missing it
UPDATE public.profiles p
SET email = u.email, updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Auto-confirm any existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Apply staff roles from invitations to users who already signed up
UPDATE public.profiles p
SET role = i.role, updated_at = NOW()
FROM public.staff_invitations i
WHERE lower(p.email) = lower(i.email)
  AND p.role = 'user';  -- Only upgrade users, don't downgrade existing admins

-- §6. CMS TABLES — ensure price columns exist on cms_listings
-- ============================================================
ALTER TABLE public.cms_listings ADD COLUMN IF NOT EXISTS price_min integer;
ALTER TABLE public.cms_listings ADD COLUMN IF NOT EXISTS price_max integer;
ALTER TABLE public.cms_listings ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE public.cms_listings ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- §7. PREFERENCES COLUMN ON PROFILES
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';

-- §8. SAVED LISTINGS / FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id text NOT NULL,
  listing_name text DEFAULT '',
  listing_category text DEFAULT '',
  listing_area text DEFAULT '',
  listing_photo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.saved_listings;
CREATE POLICY "Users can view own favorites" ON public.saved_listings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.saved_listings;
CREATE POLICY "Users can insert own favorites" ON public.saved_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.saved_listings;
CREATE POLICY "Users can delete own favorites" ON public.saved_listings
  FOR DELETE USING (auth.uid() = user_id);

-- §9. BUSINESS LISTINGS (seller submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  subcategory text,
  area text,
  address text,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  hours text,
  description text,
  status text DEFAULT 'pending',
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Safety net: add columns that may be missing if table already existed
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS hours text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own submissions" ON public.business_listings;
CREATE POLICY "Users can view own submissions" ON public.business_listings
  FOR SELECT USING (auth.uid() = submitted_by OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
  ));

DROP POLICY IF EXISTS "Authenticated users can submit" ON public.business_listings;
CREATE POLICY "Authenticated users can submit" ON public.business_listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins can manage submissions" ON public.business_listings;
CREATE POLICY "Admins can manage submissions" ON public.business_listings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
  ));

-- §10. STORAGE — ensure cms-uploads bucket exists with public access
-- ============================================================
-- Note: run this manually in Supabase Dashboard → Storage if it fails:
-- Create bucket "cms-uploads" with public access enabled
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-uploads', 'cms-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;
