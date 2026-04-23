/**
 * POST /api/feedback
 *
 * Accepts feedback submissions from both authenticated users and anonymous
 * visitors (e.g. /login, /signup pages). File attachments (up to 3, 5 MB each)
 * are uploaded to Google Drive if credentials are configured; otherwise the
 * row is still saved without the attachment metadata.
 *
 * Body: JSON { category, rating, message, email, page_url, user_agent, userId }
 *   OR: multipart/form-data with the same fields plus file[] inputs.
 *
 * Returns: { id, ...feedbackRow }
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Simple in-memory rate limit: max 10 submissions per IP per 15 minutes
const ipCounts = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now - entry.reset > RATE_WINDOW_MS) {
    ipCounts.set(ip, { count: 1, reset: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }

  const body = req.body || {};
  const { category, rating, message, email, page_url, user_agent, userId } = body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Use service role key if available (for server-side insert bypassing RLS),
  // fall back to anon key which will work given the "Anyone can insert" policy.
  const supabaseKey = SUPABASE_SERVICE_KEY || ANON_KEY;
  if (!SUPABASE_URL || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(SUPABASE_URL, supabaseKey);

  // Insert feedback row
  const { data: feedback, error: insertError } = await supabase
    .from('feedback')
    .insert({
      user_id: userId || null,
      category: category || 'Other',
      rating: rating ? Number(rating) : null,
      message: message.trim(),
      email: email?.trim() || null,
      page_url: page_url || null,
      user_agent: user_agent || null,
      status: 'open',
      attachments: [],
    })
    .select()
    .single();

  if (insertError) {
    console.error('feedback insert error:', insertError);
    return res.status(500).json({ error: `Failed to save feedback: ${insertError.message}` });
  }

  // File attachment handling via Google Drive (optional — skipped if credentials absent)
  // Files are expected as base64-encoded strings in body.files: [{ name, mime, data }]
  const files = body.files;
  if (Array.isArray(files) && files.length > 0) {
    try {
      const { uploadToDrive } = await import('./_lib/drive.js');
      const uploaded = [];
      for (const file of files.slice(0, 3)) {
        if (!file?.data || !file?.name) continue;
        const buffer = Buffer.from(file.data, 'base64');
        const result = await uploadToDrive({
          parentFolderId: process.env.GDRIVE_FEEDBACK_FOLDER_ID,
          subfolderName: feedback.id,
          file: { name: file.name, mime: file.mime || 'application/octet-stream', buffer },
        });
        uploaded.push(result);
      }
      if (uploaded.length > 0) {
        await supabase
          .from('feedback')
          .update({ attachments: uploaded, updated_at: new Date().toISOString() })
          .eq('id', feedback.id);
        feedback.attachments = uploaded;
      }
    } catch (driveErr) {
      // Non-fatal: row is already saved, just log the Drive failure
      console.warn('Drive upload failed (attachments not stored):', driveErr.message);
    }
  }

  return res.status(201).json(feedback);
}
