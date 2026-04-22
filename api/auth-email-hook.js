// POST /api/auth-email-hook
//
// Supabase Auth "Send Email" hook (Standard Webhooks). Supabase POSTs here
// instead of sending email itself. We verify the HMAC signature, then forward
// selected events to Resend.
//
// Payload shape (Supabase docs, current 2025):
//   {
//     user: { id, email, ... },
//     email_data: {
//       token, token_hash, redirect_to, email_action_type,
//       site_url, token_new, token_hash_new
//     }
//   }
//
// For this project we only handle `recovery` (password reset). Other event
// types return 200 with a skip note so Supabase doesn't retry — our product
// flow doesn't rely on Supabase's built-in signup/magic-link emails.

import crypto from 'node:crypto';
import { sendEmail } from './_lib/resend.js';
import { passwordResetEmail } from './_lib/templates.js';

export const config = {
  // We need the raw body to compute the HMAC; disable Vercel's JSON parsing.
  api: { bodyParser: false },
};

function json(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json');
  res.send(JSON.stringify(body));
}

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Standard Webhooks signature format: each `webhook-signature` header value is
// a space-separated list of `v1,<base64(HMAC_SHA256(id.timestamp.body))>` items.
// The secret is distributed as `v1,whsec_<base64>` — we strip the `v1,whsec_`
// prefix and base64-decode the rest to get the actual HMAC key.
function verifySignature({ id, timestamp, rawBody, signatureHeader, secret }) {
  if (!id || !timestamp || !rawBody || !signatureHeader || !secret) return false;

  // Reject stale timestamps (>5 min).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) return false;

  let keyBase64 = secret;
  if (keyBase64.startsWith('v1,whsec_')) keyBase64 = keyBase64.slice('v1,whsec_'.length);
  else if (keyBase64.startsWith('whsec_')) keyBase64 = keyBase64.slice('whsec_'.length);

  let key;
  try {
    key = Buffer.from(keyBase64, 'base64');
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const signedPayload = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', key).update(signedPayload).digest('base64');

  const provided = signatureHeader.split(' ')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3));

  return provided.some((sig) => {
    try {
      const a = Buffer.from(sig, 'base64');
      const b = Buffer.from(expected, 'base64');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { SEND_EMAIL_HOOK_SECRET, APP_URL } = process.env;
  if (!SEND_EMAIL_HOOK_SECRET) {
    console.error('auth-email-hook: SEND_EMAIL_HOOK_SECRET not set');
    return json(res, 500, { error: 'Server not configured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (e) {
    return json(res, 400, { error: 'Could not read body' });
  }

  const id = req.headers['webhook-id'];
  const timestamp = req.headers['webhook-timestamp'];
  const signature = req.headers['webhook-signature'];
  const ok = verifySignature({
    id: Array.isArray(id) ? id[0] : id,
    timestamp: Array.isArray(timestamp) ? timestamp[0] : timestamp,
    rawBody,
    signatureHeader: Array.isArray(signature) ? signature[0] : signature,
    secret: SEND_EMAIL_HOOK_SECRET,
  });
  if (!ok) {
    console.warn('auth-email-hook: signature verification failed');
    return json(res, 401, { error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const { user, email_data: emailData } = payload || {};
  const action = emailData?.email_action_type;
  const to = user?.email;

  // Only recovery is routed through Resend — other action types are no-ops.
  if (action !== 'recovery') {
    return json(res, 200, { ok: true, skipped: action || 'unknown' });
  }
  if (!to) return json(res, 422, { error: 'No user email in payload' });
  if (!emailData?.token_hash) return json(res, 422, { error: 'Missing token_hash' });

  const base = APP_URL || emailData?.site_url || '';
  if (!base) {
    console.error('auth-email-hook: no APP_URL/site_url to build reset link');
    return json(res, 500, { error: 'Missing APP_URL' });
  }
  const resetUrl = `${base.replace(/\/$/, '')}/reset-password`
    + `?token_hash=${encodeURIComponent(emailData.token_hash)}`
    + `&type=recovery`;

  const { subject, html } = passwordResetEmail({ resetUrl });

  try {
    const result = await sendEmail({ to, subject, html });
    return json(res, 200, { ok: true, id: result?.id || null });
  } catch (e) {
    console.error('auth-email-hook: resend failed', e);
    return json(res, 502, { error: 'Email send failed' });
  }
}
