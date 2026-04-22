// POST /api/notify-user-approved
// Headers: Authorization: Bearer <supabase access token of calling admin>
// Body: { userId: string }
//
// Called by the admin UI right after flipping a profile to `active`. We verify
// the caller is actually an admin before sending to prevent anyone with an
// authenticated session from triggering emails to arbitrary users.

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './_lib/resend.js';
import { userApprovedEmail } from './_lib/templates.js';

function json(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json');
  res.send(JSON.stringify(body));
}

async function readJsonBody(req) {
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

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('notify-user-approved: missing env vars');
    return json(res, 500, { error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json(res, 401, { error: 'Missing bearer token' });

  const body = await readJsonBody(req);
  const userId = body?.userId;
  if (!userId || typeof userId !== 'string') {
    return json(res, 400, { error: 'userId required' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the caller owns this token and is an admin.
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    return json(res, 401, { error: 'Invalid token' });
  }
  const callerId = userRes.user.id;

  const { data: callerProfile, error: callerErr } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', callerId)
    .single();
  if (callerErr || callerProfile?.role !== 'admin' || callerProfile?.status !== 'active') {
    return json(res, 403, { error: 'Admin access required' });
  }

  // Load target user.
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, name, email, status')
    .eq('id', userId)
    .single();
  if (targetErr || !target) return json(res, 404, { error: 'User not found' });
  if (target.status !== 'active') {
    return json(res, 409, { error: 'User is not active; skipping approval email' });
  }
  if (!target.email) return json(res, 422, { error: 'User has no email on file' });

  const loginUrl = APP_URL ? `${APP_URL}/login` : '/login';
  const { subject, html } = userApprovedEmail({ name: target.name, loginUrl });

  try {
    const result = await sendEmail({ to: target.email, subject, html });
    return json(res, 200, { ok: true, id: result?.id || null });
  } catch (e) {
    console.error('notify-user-approved: resend failed', e);
    return json(res, 502, { error: 'Email send failed' });
  }
}
