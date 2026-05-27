-- ═══════════════════════════════════════════════════════════
-- Wanda CMS: Fix RLS Policies + Storage + Profile Fields
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────
-- 1. HELPER: Function to check if user is admin/editor/moderator
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor', 'moderator')
  );
$$;

-- ──────────────────────────────────────────────────────────
-- 2. FIX RLS POLICIES ON ALL CMS TABLES
-- ──────────────────────────────────────────────────────────

-- === cms_listings ===
ALTER TABLE public.cms_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read listings" ON public.cms_listings;
DROP POLICY IF EXISTS "Staff can insert listings" ON public.cms_listings;
DROP POLICY IF EXISTS "Staff can update listings" ON public.cms_listings;
DROP POLICY IF EXISTS "Staff can delete listings" ON public.cms_listings;

CREATE POLICY "Anyone can read listings" ON public.cms_listings FOR SELECT USING (true);
CREATE POLICY "Staff can insert listings" ON public.cms_listings FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update listings" ON public.cms_listings FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can delete listings" ON public.cms_listings FOR DELETE USING (public.is_staff());

-- === cms_deals ===
ALTER TABLE public.cms_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read deals" ON public.cms_deals;
DROP POLICY IF EXISTS "Staff can insert deals" ON public.cms_deals;
DROP POLICY IF EXISTS "Staff can update deals" ON public.cms_deals;
DROP POLICY IF EXISTS "Staff can delete deals" ON public.cms_deals;

CREATE POLICY "Anyone can read deals" ON public.cms_deals FOR SELECT USING (true);
CREATE POLICY "Staff can insert deals" ON public.cms_deals FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update deals" ON public.cms_deals FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can delete deals" ON public.cms_deals FOR DELETE USING (public.is_staff());

-- === cms_sponsors ===
ALTER TABLE public.cms_sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read sponsors" ON public.cms_sponsors;
DROP POLICY IF EXISTS "Staff can insert sponsors" ON public.cms_sponsors;
DROP POLICY IF EXISTS "Staff can update sponsors" ON public.cms_sponsors;
DROP POLICY IF EXISTS "Staff can delete sponsors" ON public.cms_sponsors;

CREATE POLICY "Anyone can read sponsors" ON public.cms_sponsors FOR SELECT USING (true);
CREATE POLICY "Staff can insert sponsors" ON public.cms_sponsors FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update sponsors" ON public.cms_sponsors FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can delete sponsors" ON public.cms_sponsors FOR DELETE USING (public.is_staff());

-- === cms_discovery ===
ALTER TABLE public.cms_discovery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read discovery" ON public.cms_discovery;
DROP POLICY IF EXISTS "Staff can insert discovery" ON public.cms_discovery;
DROP POLICY IF EXISTS "Staff can update discovery" ON public.cms_discovery;
DROP POLICY IF EXISTS "Staff can delete discovery" ON public.cms_discovery;

CREATE POLICY "Anyone can read discovery" ON public.cms_discovery FOR SELECT USING (true);
CREATE POLICY "Staff can insert discovery" ON public.cms_discovery FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update discovery" ON public.cms_discovery FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can delete discovery" ON public.cms_discovery FOR DELETE USING (public.is_staff());

-- === cms_questions ===
ALTER TABLE public.cms_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read questions" ON public.cms_questions;
DROP POLICY IF EXISTS "Staff can insert questions" ON public.cms_questions;
DROP POLICY IF EXISTS "Staff can update questions" ON public.cms_questions;
DROP POLICY IF EXISTS "Staff can delete questions" ON public.cms_questions;

CREATE POLICY "Anyone can read questions" ON public.cms_questions FOR SELECT USING (true);
CREATE POLICY "Staff can insert questions" ON public.cms_questions FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update questions" ON public.cms_questions FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can delete questions" ON public.cms_questions FOR DELETE USING (public.is_staff());

-- === profiles ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can update all profiles" ON public.profiles FOR UPDATE USING (public.is_staff());

-- ──────────────────────────────────────────────────────────
-- 3. ADD FIRST/LAST NAME COLUMNS TO PROFILES (if missing)
-- ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE public.profiles ADD COLUMN first_name text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE public.profiles ADD COLUMN location text DEFAULT '';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────
-- 4. CREATE STORAGE BUCKET FOR MEDIA UPLOADS
-- ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,  -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4'];

-- Storage RLS: anyone can view, authenticated staff can upload/delete
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload access" ON storage.objects;
DROP POLICY IF EXISTS "Staff delete access" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;

CREATE POLICY "Public read access" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Staff upload access" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND public.is_staff());

CREATE POLICY "Staff delete access" ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.is_staff());

-- Allow any authenticated user to upload to the 'avatars/' folder
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avatars' AND auth.role() = 'authenticated');

-- ──────────────────────────────────────────────────────────
-- 5. WAITLIST TABLE (if not exists)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  role text,
  message text,
  referral text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Staff can read waitlist" ON public.waitlist;
CREATE POLICY "Anyone can insert waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can read waitlist" ON public.waitlist FOR SELECT USING (public.is_staff());

-- ──────────────────────────────────────────────────────────
-- 6. STAFF INVITATIONS TABLE (if not exists)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  invited_by uuid REFERENCES auth.users(id),
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Admin can insert invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Admin can delete invitations" ON public.staff_invitations;
CREATE POLICY "Staff can read invitations" ON public.staff_invitations FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin can insert invitations" ON public.staff_invitations FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Admin can delete invitations" ON public.staff_invitations FOR DELETE USING (public.is_staff());

-- ══════════════════════════════════════════════════════════
-- DONE! All RLS policies, storage bucket, and profile fields are set up.
-- ══════════════════════════════════════════════════════════
