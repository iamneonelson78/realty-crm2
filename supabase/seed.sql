-- Seed Data for Realty CRM
-- Users are created via Supabase Dashboard. This file seeds public schema only.
--
-- Credentials:
--   admin@realty.com  → ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5
--   agent@realty.com  → 7379f1db-a48f-44d2-b0e3-3c50bb502bb8
--
-- Safe to re-run; conflict handling via ON CONFLICT / WHERE clauses.

-- 1. Cleanup existing seed data in public schema
DELETE FROM public.connections WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.leads       WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.listings    WHERE agent_id = '7379f1db-a48f-44d2-b0e3-3c50bb502bb8';
DELETE FROM public.feedback    WHERE user_id IN (
  'ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5',
  '7379f1db-a48f-44d2-b0e3-3c50bb502bb8'
);

-- 2. Ensure required auth users exist, then upsert public profile rows.
--    This avoids FK failures when the auth trigger did not backfill profiles.
DO $$
DECLARE
  missing_user_ids TEXT;
BEGIN
  SELECT string_agg(required.id::text, ', ')
  INTO missing_user_ids
  FROM (
    VALUES
      ('ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5'::uuid),
      ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8'::uuid)
  ) AS required(id)
  LEFT JOIN auth.users au ON au.id = required.id
  WHERE au.id IS NULL;

  IF missing_user_ids IS NOT NULL THEN
    RAISE EXCEPTION
      'Missing auth.users row(s): %. Create these users first via Supabase Dashboard/Auth Admin.',
      missing_user_ids;
  END IF;
END
$$;

INSERT INTO public.profiles (
  id, status, name, email, role, phone, location, connections_enabled, temp_password_required
)
VALUES
  (
    'ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5', 'active', 'Admin Manager',
    'admin@realty.com', 'admin', '+63 917 000 0000', 'Makati City', false, false
  ),
  (
    '7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'active', 'Pro Agent',
    'agent@realty.com', 'agent', '+63 917 000 0001', 'Taguig City', true, false
  )
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    connections_enabled = EXCLUDED.connections_enabled,
    temp_password_required = EXCLUDED.temp_password_required;

-- 3. Seed listings owned by the agent
INSERT INTO public.listings (id, agent_id, title, rent, location, beds, rules)
VALUES
  ('10000000-0000-0000-0000-000000000011', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'BGC 2BR Fully Furnished', 45000, 'Avida Towers, BGC', '2',
   'No Pets, Minimum 1 Year'),
  ('10000000-0000-0000-0000-000000000012', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Makati Studio Skyline View', 25000, 'Jazz Residences', '0',
   '1 Mo Adv, 1 Mo Dep');

-- 4. Seed leads across every pipeline stage
INSERT INTO public.leads (id, agent_id, name, messenger, mobile, unit, status, close_reason)
VALUES
  ('20000000-0000-0000-0000-000000000021', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Juan Dela Cruz', 'm.me/juan', '09170000001', 'Avida Towers 1BR', 'inquiry', NULL),
  ('20000000-0000-0000-0000-000000000022', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Maria Santos', 'm.me/maria', '09170000002', 'SMDC Light', 'contacted', NULL),
  ('20000000-0000-0000-0000-000000000023', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Elena Reyes', 'm.me/elena', '09170000003', 'BGC 2BR Bare', 'viewing', NULL),
  ('20000000-0000-0000-0000-000000000024', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Andres Bonifacio', 'm.me/andres', '09170000004', 'Megaworld Studio', 'reserved', NULL),
  ('20000000-0000-0000-0000-000000000025', '7379f1db-a48f-44d2-b0e3-3c50bb502bb8',
   'Jose Rizal', 'm.me/jose', '09170000005', 'Jazz Res 1BR', 'closed', 'Closed Won');

-- 5. Seed one sample connection for the agent (Messenger)
INSERT INTO public.connections (
  agent_id, platform, handle, status, connected_at
) VALUES (
  '7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'messenger',
  'm.me/pro.agent', 'connected', now()
) ON CONFLICT (agent_id, platform) DO UPDATE
  SET handle = EXCLUDED.handle,
      status = EXCLUDED.status,
      connected_at = EXCLUDED.connected_at;

-- 6. Seed sample feedback rows
INSERT INTO public.feedback (user_id, category, rating, message)
VALUES
  ('7379f1db-a48f-44d2-b0e3-3c50bb502bb8', 'Suggestion', 5, 'Love the pipeline board and listing tools.'),
  ('ec97a4d8-64e8-49c9-9d74-5ce13a7d75f5', 'Question', 4, 'Please add role change audit logs in admin access.');
