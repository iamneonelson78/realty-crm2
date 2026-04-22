import { supabase } from './supabaseClient';

export async function listListings(agentId) {
  if (!agentId) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const toPayload = (fields) => ({
  title: fields.title,
  rent: fields.rent === '' || fields.rent == null ? null : Number(fields.rent),
  location: fields.location || null,
  beds: fields.beds || null,
  rules: fields.rules || null,
});

export async function createListing(agentId, fields) {
  if (!agentId) throw new Error('agentId required');
  const { data, error } = await supabase
    .from('listings')
    .insert({ agent_id: agentId, ...toPayload(fields) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateListing(id, fields) {
  const { data, error } = await supabase
    .from('listings')
    .update(toPayload(fields))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}
