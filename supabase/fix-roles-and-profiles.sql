-- ============================================================
-- fix-roles-and-profiles.sql  (v3 — safe & includes invitations)
-- Multi-role RBAC migration for Wanda CMS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- §0  ENSURE PROFILES TABLE HAS ALL NEEDED COLUMNS
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '🧭';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN profiles.role IS
  'User role: admin | moderator | editor | user (default). '
  'admin = full CMS access; moderator = read + edit/approve; '
  'editor = read + create + edit; user = public read only.';


-- §1  STAFF INVITATIONS TABLE (Secure Admin Invites)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'editor')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage staff invitations
DROP POLICY IF EXISTS "Admins can manage staff invitations" ON public.staff_invitations;
CREATE POLICY "Admins can manage staff invitations" ON public.staff_invitations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));


-- §2  PROFILES RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admin to INSERT profiles (for creating staff accounts)
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
CREATE POLICY "Admins can insert any profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));


-- §3  CMS_LISTINGS — granular role policies
-- ============================================================
DROP POLICY IF EXISTS "admin_all_listings" ON cms_listings;

DROP POLICY IF EXISTS "public_read_listings" ON cms_listings;
CREATE POLICY "public_read_listings" ON cms_listings
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "staff_select_listings" ON cms_listings;
CREATE POLICY "staff_select_listings" ON cms_listings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

DROP POLICY IF EXISTS "staff_insert_listings" ON cms_listings;
CREATE POLICY "staff_insert_listings" ON cms_listings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));

DROP POLICY IF EXISTS "staff_update_listings" ON cms_listings;
CREATE POLICY "staff_update_listings" ON cms_listings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));

DROP POLICY IF EXISTS "admin_delete_listings" ON cms_listings;
CREATE POLICY "admin_delete_listings" ON cms_listings
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §4  CMS_DEALS
-- ============================================================
DROP POLICY IF EXISTS "admin_all_deals" ON cms_deals;
DROP POLICY IF EXISTS "public_read_deals" ON cms_deals;
CREATE POLICY "public_read_deals" ON cms_deals FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "staff_select_deals" ON cms_deals;
CREATE POLICY "staff_select_deals" ON cms_deals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_insert_deals" ON cms_deals;
CREATE POLICY "staff_insert_deals" ON cms_deals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
DROP POLICY IF EXISTS "staff_update_deals" ON cms_deals;
CREATE POLICY "staff_update_deals" ON cms_deals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_deals" ON cms_deals;
CREATE POLICY "admin_delete_deals" ON cms_deals FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §5  CMS_SPONSORS
-- ============================================================
DROP POLICY IF EXISTS "admin_all_sponsors" ON cms_sponsors;
DROP POLICY IF EXISTS "public_read_sponsors" ON cms_sponsors;
CREATE POLICY "public_read_sponsors" ON cms_sponsors FOR SELECT TO anon, authenticated USING (active = true AND status = 'published');
DROP POLICY IF EXISTS "staff_select_sponsors" ON cms_sponsors;
CREATE POLICY "staff_select_sponsors" ON cms_sponsors FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_insert_sponsors" ON cms_sponsors;
CREATE POLICY "staff_insert_sponsors" ON cms_sponsors FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
DROP POLICY IF EXISTS "staff_update_sponsors" ON cms_sponsors;
CREATE POLICY "staff_update_sponsors" ON cms_sponsors FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_sponsors" ON cms_sponsors;
CREATE POLICY "admin_delete_sponsors" ON cms_sponsors FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §6  CMS_DISCOVERY
-- ============================================================
DROP POLICY IF EXISTS "admin_all_discovery" ON cms_discovery;
DROP POLICY IF EXISTS "public_read_discovery" ON cms_discovery;
CREATE POLICY "public_read_discovery" ON cms_discovery FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "staff_select_discovery" ON cms_discovery;
CREATE POLICY "staff_select_discovery" ON cms_discovery FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_insert_discovery" ON cms_discovery;
CREATE POLICY "staff_insert_discovery" ON cms_discovery FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
DROP POLICY IF EXISTS "staff_update_discovery" ON cms_discovery;
CREATE POLICY "staff_update_discovery" ON cms_discovery FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_discovery" ON cms_discovery;
CREATE POLICY "admin_delete_discovery" ON cms_discovery FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §7  CMS_QUESTIONS
-- ============================================================
DROP POLICY IF EXISTS "admin_all_questions" ON cms_questions;
DROP POLICY IF EXISTS "public_read_questions" ON cms_questions;
CREATE POLICY "public_read_questions" ON cms_questions FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "staff_select_questions" ON cms_questions;
CREATE POLICY "staff_select_questions" ON cms_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_insert_questions" ON cms_questions;
CREATE POLICY "staff_insert_questions" ON cms_questions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
DROP POLICY IF EXISTS "staff_update_questions" ON cms_questions;
CREATE POLICY "staff_update_questions" ON cms_questions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_questions" ON cms_questions;
CREATE POLICY "admin_delete_questions" ON cms_questions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §8  CMS_CONFIG
-- ============================================================
DROP POLICY IF EXISTS "admin_all_config" ON cms_config;
DROP POLICY IF EXISTS "public_read_config" ON cms_config;
CREATE POLICY "public_read_config" ON cms_config FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_select_config" ON cms_config;
CREATE POLICY "staff_select_config" ON cms_config FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_insert_config" ON cms_config;
CREATE POLICY "staff_insert_config" ON cms_config FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
DROP POLICY IF EXISTS "staff_update_config" ON cms_config;
CREATE POLICY "staff_update_config" ON cms_config FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_config" ON cms_config;
CREATE POLICY "admin_delete_config" ON cms_config FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §9  BUSINESS_LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, category text NOT NULL, subcategory text,
  area text NOT NULL, address text, phone text, whatsapp text,
  website text, instagram text, hours text, price_range text,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit business listings" ON business_listings;
CREATE POLICY "Anyone can submit business listings" ON business_listings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage business listings" ON business_listings;
DROP POLICY IF EXISTS "staff_select_business" ON business_listings;
CREATE POLICY "staff_select_business" ON business_listings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_update_business" ON business_listings;
CREATE POLICY "staff_update_business" ON business_listings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_business" ON business_listings;
CREATE POLICY "admin_delete_business" ON business_listings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §10  STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-uploads', 'cms-uploads', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_view_cms" ON storage.objects;
CREATE POLICY "public_view_cms" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'cms-uploads');
DROP POLICY IF EXISTS "admin_upload_cms" ON storage.objects;
DROP POLICY IF EXISTS "staff_upload_cms" ON storage.objects;
CREATE POLICY "staff_upload_cms" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms-uploads' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "staff_update_cms" ON storage.objects;
CREATE POLICY "staff_update_cms" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cms-uploads' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','moderator','editor')));
DROP POLICY IF EXISTS "admin_delete_cms" ON storage.objects;
CREATE POLICY "admin_delete_cms" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cms-uploads' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- §11  AUTO-CREATE PROFILE ON SIGNUP (Trigger updated for invites)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role text;
BEGIN
  -- Check if the signing-up user is in our invitations table
  SELECT role INTO invited_role FROM public.staff_invitations WHERE lower(email) = lower(NEW.email);

  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧭'),
    COALESCE(invited_role, NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    role = COALESCE(invited_role, EXCLUDED.role, profiles.role),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Back-fill: create profile rows for any auth users missing one
INSERT INTO public.profiles (id, email, avatar_url, role)
SELECT id, email, '🧭', 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Back-fill email for existing profiles that don't have it
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Auto-assign roles from invites to existing users if they signed up already
UPDATE public.profiles p
SET role = i.role
FROM public.staff_invitations i
WHERE lower(p.email) = lower(i.email);


-- §12  AUTO-CONFIRM SIGNUPS
-- ============================================================
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
