-- ============================================
-- Wanda CMS — Schema Alignment Fix
-- Run this in the Supabase SQL Editor
-- Fixes ALL "column not found in schema cache" errors
-- Safe to run multiple times (fully idempotent)
-- ============================================

-- ═══ 1. cms_discovery — add missing columns ═══
-- The admin UI uses 'photos' but the original schema used 'images'.
-- We add 'photos' so both work, and 'updated_by' which handleSave() always sets.
ALTER TABLE cms_discovery ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE cms_discovery ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Migrate any existing data from 'images' → 'photos' if photos is empty
UPDATE cms_discovery
SET photos = images
WHERE images IS NOT NULL
  AND array_length(images, 1) > 0
  AND (photos IS NULL OR array_length(photos, 1) IS NULL);

-- ═══ 2. cms_deals — add missing columns ═══
ALTER TABLE cms_deals ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- ═══ 3. cms_sponsors — add missing columns ═══
ALTER TABLE cms_sponsors ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- ═══ 4. cms_questions — add missing columns ═══
ALTER TABLE cms_questions ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- ═══ 5. cms_listings — add missing columns ═══
-- 'photo' (singular) is used by the approve flow for the cover image
-- 'address' is sent during approve but didn't exist
ALTER TABLE cms_listings ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE cms_listings ADD COLUMN IF NOT EXISTS address text;

-- ═══ 6. business_listings — safety net for handyman columns ═══
-- (These are also in add-products-and-handyman.sql, but having them here
-- ensures a single migration covers everything)
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS products text[] DEFAULT '{}';
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'business';
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS trade text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}';
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS price_range text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- ═══ 7. Ensure RLS policies allow admin read on business_listings ═══
-- (Submissions section needs admin to read ALL rows, not just own)
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.business_listings;
CREATE POLICY "Admins can manage submissions" ON public.business_listings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

-- ═══ 8. Ensure anon can read approved handyman listings ═══
DROP POLICY IF EXISTS "Public read approved listings" ON public.business_listings;
CREATE POLICY "Public read approved listings" ON public.business_listings
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

-- ═══ DONE ═══
-- All CMS tables now have every column the admin code expects.
-- You can safely edit Discovery, Deals, Sponsors, Questions, and Listings
-- without hitting "column not found in schema cache" errors.
