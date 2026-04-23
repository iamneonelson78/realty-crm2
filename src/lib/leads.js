import { supabase } from './supabaseClient';

export const LEAD_STATUSES = ['inquiry', 'contacted', 'viewing', 'reserved', 'closed'];
export const CLOSE_REASONS = ['Closed Won', 'Closed Lost', 'Cancelled', 'Duplicate'];

export async function listLeads(agentId) {
  if (!agentId) return [];
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createLead(agentId, fields) {
  if (!agentId) throw new Error('agentId required');
  const payload = {
    agent_id: agentId,
    name: fields.name,
    messenger: fields.messengerLink || fields.messenger || null,
    mobile: fields.mobile || null,
    unit: fields.interestedUnit || fields.unit || null,
    status: fields.status || 'inquiry',
  };
  const { data, error } = await supabase
    .from('leads')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(id, status, closeReason = null) {
  if (!LEAD_STATUSES.includes(status)) throw new Error(`Invalid lead status: ${status}`);
  const payload = { status };
  if (status === 'closed' && closeReason) payload.close_reason = closeReason;
  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 60) return 'Just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk} week${wk === 1 ? '' : 's'} ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const yr = Math.round(day / 365);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}
