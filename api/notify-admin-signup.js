// POST /api/notify-admin-signup
// Body: { userId: string }
//
// Called by the client right after a successful `supabase.auth.signUp()`.
// We re-fetch the target profile with the service role key to avoid trusting
// whatever the client sends, and only send an email if the profile actually
// exists and is still `pending` (prevents replay / noise).

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './_lib/resend.js';
import { adminNewSignupEmail } from './_lib/templates.js';

function json(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json');
  res.send(JSON.stringify(body));
}

async function readJsonBody(req) {
  // Vercel's Node runtime parses JSON automatically when content-type is
  // application/json, but guard for raw streams too.
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, APP_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL) {
    console.error('notify-admin-signup: missing env vars');
    return json(res, 500, { error: 'Server not configured' });
  }

  const body = await readJsonBody(req);
  const userId = body?.userId;
  if (!userId || typeof userId !== 'string') {
    return json(res, 400, { error: 'userId required' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, name, email, status')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.warn('notify-admin-signup: profile lookup failed', userId, error?.message);
    // Don't leak whether the id exists.
    return json(res, 404, { error: 'Profile not found' });
  }
  if (profile.status !== 'pending') {
    // Already handled — don't re-notify.
    return json(res, 200, { ok: true, skipped: 'not-pending' });
  }

  const approveUrl = APP_URL ? `${APP_URL}/admin/access?status=pending&view=${profile.id}` : null;
  const { subject, html } = adminNewSignupEmail({
    name: profile.name,
    email: profile.email,
    approveUrl,
  });

  try {
    const result = await sendEmail({ to: ADMIN_EMAIL, subject, html });
    return json(res, 200, { ok: true, id: result?.id || null });
  } catch (e) {
    console.error('notify-admin-signup: resend failed', e);
    return json(res, 502, { error: 'Email send failed' });
  }
}
