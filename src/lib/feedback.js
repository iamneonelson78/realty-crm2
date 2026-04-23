import { supabase } from './supabaseClient';

/**
 * List feedback rows with optional filters.
 * Admins only — relies on the "Admins read feedback" RLS policy.
 *
 * @param {Object} filters
 * @param {string[]} [filters.status]       - e.g. ['open','ongoing']
 * @param {string[]} [filters.category]     - e.g. ['Bug','Suggestion']
 * @param {number}   [filters.minRating]    - 1-5
 * @param {string}   [filters.dateFrom]     - ISO string
 * @param {string}   [filters.dateTo]       - ISO string
 * @param {string}   [filters.search]       - searches message + email
 */
export async function listFeedback(filters = {}) {
  let query = supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters.category?.length) {
    query = query.in('category', filters.category);
  }
  if (filters.minRating) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`message.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Update the status of a feedback row.
 * @param {string} id
 * @param {'open'|'ongoing'|'replied'|'closed'} status
 */
export async function updateFeedbackStatus(id, status) {
  const { data, error } = await supabase
    .from('feedback')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Send an admin reply to a feedback row (via backend API which also emails the user).
 * @param {string} id
 * @param {string} replyText
 */
export async function replyFeedback(id, replyText) {
  const adminSecret = import.meta.env.VITE_ADMIN_API_SECRET;
  const res = await fetch('/api/notify-feedback-reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSecret || ''}`,
    },
    body: JSON.stringify({ feedbackId: id, adminReply: replyText }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 207) {
    throw new Error(body.error || `Reply failed (${res.status})`);
  }
  return body;
}

/**
 * Get a public view link for a Drive attachment.
 * The web_view_link is already stored in attachments JSONB.
 * @param {{ web_view_link?: string, webViewLink?: string }} attachment
 */
export function getAttachmentUrl(attachment) {
  return attachment?.web_view_link || attachment?.webViewLink || null;
}

/**
 * Fetch summary counts for the metrics cards.
 */
export async function getFeedbackMetrics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allRes, openRes, ongoingRes, repliedRes, closedRes, recentRatingRes, weekRes] = await Promise.all([
    supabase.from('feedback').select('id', { count: 'exact', head: true }),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'ongoing'),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'replied'),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('feedback').select('rating').gte('created_at', thirtyDaysAgo).not('rating', 'is', null),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
  ]);

  const ratings = (recentRatingRes.data ?? []).map((r) => r.rating).filter(Boolean);
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : null;

  return {
    total: allRes.count ?? 0,
    open: openRes.count ?? 0,
    ongoing: ongoingRes.count ?? 0,
    replied: repliedRes.count ?? 0,
    closed: closedRes.count ?? 0,
    avgRating,
    thisWeek: weekRes.count ?? 0,
  };
}
