-- Consolidated Schema for Realty CRM
-- Goal: Clean slate deployment. DROPS everything and recreates it.

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
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Open access for rapid development)
CREATE POLICY "Enable all actions for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.listings FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.connections FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);

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
