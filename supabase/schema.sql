-- ============================================================
--  Realty CRM — Consolidated Schema + Seed
--  Single file for a clean-slate Supabase deployment.
--  The migration file (20260423_feedback_listings_upgrade.sql)
--  is NOT needed when running this — it is already incorporated.
--
--  HOW TO RUN:
--  Step 1 → Paste & run THIS file in Supabase SQL Editor.
--  Step 2 → Create auth users in Supabase Dashboard:
--             Authentication → Users → Add user
--             admin@realty.com  (UUID: ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5)
--             agent@realty.com  (UUID: 7379f1db-a48f-44d2-b0e3-3c50bb502bb8)
--  Step 3 → Run ONLY the "SEED DATA" section below (or run the full file
--            again after users are created — the seed block is safe to re-run).
-- ============================================================

-- ============================================================
--  SCHEMA — drops everything and recreates clean
-- ============================================================

-- 0. Cleanup existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS connections_set_updated_at ON public.connections;
DROP FUNCTION IF EXISTS public.touch_connections_updated_at();

DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.listing_templates CASCADE;

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
    status TEXT CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'pending',
    connections_enabled BOOLEAN DEFAULT false,
  temp_password_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    messenger TEXT,
    mobile TEXT,
    unit TEXT,
    status TEXT CHECK (status IN ('inquiry', 'contacted', 'viewing', 'reserved', 'closed')) DEFAULT 'inquiry',
    close_reason TEXT CHECK (close_reason IN ('Closed Won', 'Closed Lost', 'Cancelled', 'Duplicate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Listings Table
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    rent NUMERIC,
    location TEXT,
    beds TEXT,
    rules TEXT,
    category TEXT,
    status TEXT CHECK (status IN ('available','reserved','rented','archived')) DEFAULT 'available',
    description TEXT,
    bathrooms TEXT,
    floor_area TEXT,
    amenities TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Connections Table
CREATE TABLE public.connections (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform      TEXT NOT NULL CHECK (platform IN ('facebook', 'messenger', 'whatsapp', 'viber')),
    handle        TEXT,
    display_name  TEXT,
    status        TEXT CHECK (status IN ('connected', 'disconnected')) DEFAULT 'disconnected',
    connected_at  TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (agent_id, platform)
);

-- 5. Create Feedback Table
CREATE TABLE public.feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category    TEXT,
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  message     TEXT NOT NULL,
  status      TEXT CHECK (status IN ('open','ongoing','replied','closed')) DEFAULT 'open',
  email       TEXT,
  page_url    TEXT,
  user_agent  TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  admin_reply TEXT,
  replied_at  TIMESTAMP WITH TIME ZONE,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Listing Templates Table (cross-device persistence)
CREATE TABLE public.listing_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_templates ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Open access for rapid development)
CREATE POLICY "Enable all actions for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.listings FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.connections FOR ALL TO authenticated USING (true);

-- Feedback: allow anonymous inserts (widget on /login, /signup), admins read/update
CREATE POLICY "Anyone can insert feedback" ON public.feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins read feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admins update feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Listing templates: agents manage their own
CREATE POLICY "Agents manage own templates" ON public.listing_templates
  FOR ALL TO authenticated
  USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS listings_agent_category_idx ON public.listings (agent_id, category);
CREATE INDEX IF NOT EXISTS listings_agent_status_idx ON public.listings (agent_id, status);

-- 7. Utility Functions & Triggers

-- Trigger to seamlessly generate a Profile when a User signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'agent')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_set_temporary_password(target_user_id UUID, temporary_password TEXT)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set temporary passwords';
  END IF;

  IF temporary_password IS NULL OR length(temporary_password) < 8 THEN
    RAISE EXCEPTION 'Temporary password must be at least 8 characters';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(temporary_password, gen_salt('bf')),
      updated_at = now(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('temp_password_required', true)
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  UPDATE public.profiles
  SET temp_password_required = true
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_set_temporary_password(UUID, TEXT) TO authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to keep connections.updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_connections_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connections_set_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE PROCEDURE public.touch_connections_updated_at();

-- ============================================================
--  SEED DATA
--  Requires auth users to exist first (see HOW TO RUN above).
--  Safe to re-run multiple times.
-- ============================================================

-- Cleanup existing seed rows
DELETE FROM public.connections WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.leads       WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.listings    WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.feedback    WHERE user_id IN (
  'ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5',
  '7379f1db-a48f-44d2-b0e3-3c50bb502bb8'
);

-- Guard: fail clearly if auth users have not been created yet
DO $$
DECLARE
  missing_ids TEXT;
BEGIN
  SELECT string_agg(required.id::text, ', ')
  INTO missing_ids
  FROM (VALUES
    ('ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5'::uuid),
    ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8'::uuid)
  ) AS required(id)
  LEFT JOIN auth.users au ON au.id = required.id
  WHERE au.id IS NULL;

  IF missing_ids IS NOT NULL THEN
    RAISE EXCEPTION
      E'STOP: Missing auth.users row(s): %.\nCreate these users first via Supabase Dashboard → Authentication → Users.',
      missing_ids;
  END IF;
END $$;

-- Profiles
INSERT INTO public.profiles (id, status, name, email, role, phone, location, connections_enabled, temp_password_required)
VALUES
  ('ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5', 'active', 'Admin Manager',
   'admin@realty.com', 'admin', '+63 917 000 0000', 'Makati City', false, false),
  ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'active', 'Pro Agent',
   'agent@realty.com', 'agent', '+63 917 000 0001', 'Taguig City', true, false)
ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status, name = EXCLUDED.name, email = EXCLUDED.email,
      role = EXCLUDED.role, phone = EXCLUDED.phone, location = EXCLUDED.location,
      connections_enabled = EXCLUDED.connections_enabled,
      temp_password_required = EXCLUDED.temp_password_required;

-- Listings
INSERT INTO public.listings (id, agent_id, title, rent, location, beds, rules)
VALUES
  ('10000000-0000-0000-0000-000000000011', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'BGC 2BR Fully Furnished', 45000, 'Avida Towers, BGC', '2', 'No Pets, Minimum 1 Year'),
  ('10000000-0000-0000-0000-000000000012', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Makati Studio Skyline View', 25000, 'Jazz Residences', '0', '1 Mo Adv, 1 Mo Dep');

-- Leads (one per pipeline stage)
INSERT INTO public.leads (id, agent_id, name, messenger, mobile, unit, status)
VALUES
  ('20000000-0000-0000-0000-000000000021', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Juan Dela Cruz',    'm.me/juan',   '09170000001', 'Avida Towers 1BR',  'inquiry'),
  ('20000000-0000-0000-0000-000000000022', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Maria Santos',      'm.me/maria',  '09170000002', 'SMDC Light',        'contacted'),
  ('20000000-0000-0000-0000-000000000023', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Elena Reyes',       'm.me/elena',  '09170000003', 'BGC 2BR Bare',      'viewing'),
  ('20000000-0000-0000-0000-000000000024', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Andres Bonifacio',  'm.me/andres', '09170000004', 'Megaworld Studio',  'reserved'),
  ('20000000-0000-0000-0000-000000000025', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Jose Rizal',        'm.me/jose',   '09170000005', 'Jazz Res 1BR',      'closed');

-- Connection (Messenger)
INSERT INTO public.connections (agent_id, platform, handle, status, connected_at)
VALUES ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'messenger', 'm.me/pro.agent', 'connected', now())
ON CONFLICT (agent_id, platform) DO UPDATE
  SET handle = EXCLUDED.handle, status = EXCLUDED.status, connected_at = EXCLUDED.connected_at;

-- Sample feedback
INSERT INTO public.feedback (user_id, category, rating, message)
VALUES
  ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'Suggestion', 5,
   'Love the pipeline board and listing tools.'),
  ('ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5', 'Question', 4,
   'Please add role change audit logs in admin access.');
