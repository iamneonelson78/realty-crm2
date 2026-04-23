-- Migration: feedback upgrade + listings overhaul + listing_templates
-- Run this against your existing Supabase project if you are not doing a clean install.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).

-- ============================================================
-- 1. Feedback table: new columns
-- ============================================================

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('open','ongoing','replied','closed')) DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS page_url TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 2. Feedback RLS policies
-- ============================================================

-- Remove the old authenticated-only insert policy (if exists)
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;

-- Allow anon + authenticated inserts (widget works on /login, /signup)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'Anyone can insert feedback'
  ) THEN
    CREATE POLICY "Anyone can insert feedback" ON public.feedback
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

-- Admins read all feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'Admins read feedback'
  ) THEN
    CREATE POLICY "Admins read feedback" ON public.feedback
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Admins update feedback (status, reply)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'Admins update feedback'
  ) THEN
    CREATE POLICY "Admins update feedback" ON public.feedback
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- ============================================================
-- 3. Listings table: new columns
-- ============================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('available','reserved','rented','archived')) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS bathrooms TEXT,
  ADD COLUMN IF NOT EXISTS floor_area TEXT,
  ADD COLUMN IF NOT EXISTS amenities TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS listings_agent_category_idx ON public.listings (agent_id, category);
CREATE INDEX IF NOT EXISTS listings_agent_status_idx ON public.listings (agent_id, status);

-- ============================================================
-- 4. listing_templates table (cross-device template persistence)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listing_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.listing_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_templates' AND policyname = 'Agents manage own templates'
  ) THEN
    CREATE POLICY "Agents manage own templates" ON public.listing_templates
      FOR ALL TO authenticated
      USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());
  END IF;
END $$;
