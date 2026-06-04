-- ============================================================
-- add-products-and-handyman.sql
-- Run this in the Supabase SQL Editor (safe to re-run).
--
-- 1. Adds the missing 'products' column (fixes the listing error)
-- 2. Adds handyman/artisan support columns
-- ============================================================

-- §1. Fix: Add missing 'products' column
-- This is the root cause of "Could not find the 'products' column"
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS products text[] DEFAULT '{}';

-- §2. Add listing_type to distinguish businesses from handymen
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'business';

-- §3. Add handyman-specific fields
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS trade text;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}';

-- ============================================================
-- DONE! Your business_listings table now supports:
--   - products (text array) — for business product/service lists
--   - listing_type ('business' | 'handyman') — type discriminator
--   - trade — handyman trade (e.g. 'plumber', 'electrician')
--   - experience_years — years of experience
--   - service_areas — areas the handyman covers
-- ============================================================
