-- ============================================================
-- FIX: CMS Read Access for ALL users (not just admins/anon)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Problem: The original migration only created SELECT policies for:
--   - "anon" role (unauthenticated visitors)
--   - "admin" role (via admin_all_* policies)
-- But REGULAR AUTHENTICATED USERS had NO SELECT policy, so RLS
-- returned 0 rows for them. The frontend then fell back to
-- hardcoded static data, making admin edits invisible.

-- Fix: Replace the SELECT policies with ones that cover BOTH
-- anon AND authenticated users.

-- ── CMS_LISTINGS ──
DROP POLICY IF EXISTS "anon_read_listings" ON cms_listings;
DROP POLICY IF EXISTS "public_read_listings" ON cms_listings;
CREATE POLICY "public_read_listings" ON cms_listings
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ── CMS_DEALS ──
DROP POLICY IF EXISTS "anon_read_deals" ON cms_deals;
DROP POLICY IF EXISTS "public_read_deals" ON cms_deals;
CREATE POLICY "public_read_deals" ON cms_deals
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ── CMS_SPONSORS ──
DROP POLICY IF EXISTS "anon_read_sponsors" ON cms_sponsors;
DROP POLICY IF EXISTS "public_read_sponsors" ON cms_sponsors;
CREATE POLICY "public_read_sponsors" ON cms_sponsors
  FOR SELECT TO anon, authenticated
  USING (active = true AND status = 'published');

-- ── CMS_DISCOVERY ──
DROP POLICY IF EXISTS "anon_read_discovery" ON cms_discovery;
DROP POLICY IF EXISTS "public_read_discovery" ON cms_discovery;
CREATE POLICY "public_read_discovery" ON cms_discovery
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ── CMS_QUESTIONS ──
DROP POLICY IF EXISTS "anon_read_questions" ON cms_questions;
DROP POLICY IF EXISTS "public_read_questions" ON cms_questions;
CREATE POLICY "public_read_questions" ON cms_questions
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ── CMS_CONFIG ──
DROP POLICY IF EXISTS "anon_read_config" ON cms_config;
DROP POLICY IF EXISTS "public_read_config" ON cms_config;
CREATE POLICY "public_read_config" ON cms_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── BUSINESS_LISTINGS (user submissions) ──
-- Also ensure the table exists and has correct policies
CREATE TABLE IF NOT EXISTS business_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  area text NOT NULL,
  address text,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  hours text,
  price_range text,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (insert) a listing
DROP POLICY IF EXISTS "Anyone can submit business listings" ON business_listings;
CREATE POLICY "Anyone can submit business listings" ON business_listings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins can do everything with submissions
DROP POLICY IF EXISTS "Admins can manage business listings" ON business_listings;
CREATE POLICY "Admins can manage business listings" ON business_listings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ── STORAGE: Let everyone VIEW uploaded images ──
DROP POLICY IF EXISTS "public_view_cms" ON storage.objects;
CREATE POLICY "public_view_cms" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'cms-uploads');

-- ── AUTO-CONFIRM EMAIL (if not already done) ──
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

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
