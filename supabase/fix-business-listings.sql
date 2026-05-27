-- Run this FIRST, by itself, in the Supabase SQL Editor
-- Then run apply-all-fixes.sql

-- Step 1: Add missing columns to business_listings
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_listings') THEN
    -- Add missing columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'submitted_by') THEN
      ALTER TABLE public.business_listings ADD COLUMN submitted_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'subcategory') THEN
      ALTER TABLE public.business_listings ADD COLUMN subcategory text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'address') THEN
      ALTER TABLE public.business_listings ADD COLUMN address text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'whatsapp') THEN
      ALTER TABLE public.business_listings ADD COLUMN whatsapp text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'instagram') THEN
      ALTER TABLE public.business_listings ADD COLUMN instagram text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'hours') THEN
      ALTER TABLE public.business_listings ADD COLUMN hours text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'status') THEN
      ALTER TABLE public.business_listings ADD COLUMN status text DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'updated_at') THEN
      ALTER TABLE public.business_listings ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  ELSE
    -- Table doesn't exist, create it fresh
    CREATE TABLE public.business_listings (
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
      submitted_by uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Verify column exists
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'business_listings' 
ORDER BY ordinal_position;
