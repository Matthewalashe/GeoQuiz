-- ========================================================
-- Wanda — Email Auto-Confirm & Business Submissions Setup
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ========================================================

-- 1. Immediately confirm all existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger function to auto-confirm all future signups
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger BEFORE INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_before ON auth.users;
CREATE TRIGGER on_auth_user_created_before
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_users();

-- 3. Create the business submissions table (business_listings)
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

-- Enable RLS
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a listing (insert permission)
DROP POLICY IF EXISTS "Anyone can submit business listings" ON business_listings;
CREATE POLICY "Anyone can submit business listings" ON business_listings 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Policy: Only administrators can view and manage submissions (select, update, delete)
DROP POLICY IF EXISTS "Admins can manage business listings" ON business_listings;
CREATE POLICY "Admins can manage business listings" ON business_listings 
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
