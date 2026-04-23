/**
 * POST /api/notify-feedback-reply
 *
 * Called by the admin when they reply to a feedback submission.
 * Requires an admin bearer token (same pattern as notify-user-approved).
 *
 * Body: { feedbackId, adminReply }
 *
 * The route:
 *  1. Validates the admin token.
 *  2. Loads the feedback row (including user_id and email).
 *  3. Looks up the submitter email from their profile (if logged-in) or uses
 *     the anonymous email stored on the feedback row.
 *  4. Updates the row: admin_reply, replied_at, status = 'replied'.
 *  5. Sends the branded reply email via Resend.
 */

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './_lib/resend.js';
import { userFeedbackReplyEmail } from './_lib/templates.js';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin bearer token
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!ADMIN_SECRET || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { feedbackId, adminReply } = req.body || {};
  if (!feedbackId || !adminReply?.trim()) {
    return res.status(400).json({ error: 'feedbackId and adminReply are required' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase service credentials not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load feedback row
  const { data: feedback, error: fbError } = await supabase
    .from('feedback')
    .select('id, user_id, email, message, status')
    .eq('id', feedbackId)
    .single();

  if (fbError || !feedback) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  // Determine destination email — anonymous submissions store email on the row,
  // authenticated submissions require a profile lookup.
  let recipientEmail = feedback.email || null;
  let recipientName = 'Agent';

  if (!recipientEmail && feedback.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', feedback.user_id)
      .single();
    if (profile) {
      recipientEmail = profile.email;
      recipientName = profile.name || 'Agent';
    }
  }

  if (!recipientEmail) {
    return res.status(422).json({ error: 'No email address available for this feedback submitter' });
  }

  // Update the feedback row
  const { error: updateError } = await supabase
    .from('feedback')
    .update({
      admin_reply: adminReply.trim(),
      replied_at: new Date().toISOString(),
      status: 'replied',
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId);

  if (updateError) {
    return res.status(500).json({ error: `Failed to update feedback: ${updateError.message}` });
  }

  // Send reply email
  const emailPayload = userFeedbackReplyEmail({
    name: recipientName,
    originalMessage: feedback.message,
    adminReply: adminReply.trim(),
  });

  try {
    await sendEmail({
      to: recipientEmail,
      subject: emailPayload.subject,
      html: emailPayload.html,
    });
  } catch (emailErr) {
    // Row is already updated — log the failure but don't roll back
    console.error('Failed to send reply email:', emailErr.message);
    return res.status(207).json({ warning: 'Feedback updated but email failed to send', detail: emailErr.message });
  }

  return res.status(200).json({ success: true });
}
