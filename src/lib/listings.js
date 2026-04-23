import { supabase } from './supabaseClient';

/**
 * List listings for an agent with optional filters and sort.
 * @param {string} agentId
 * @param {{ category?: string, status?: string, search?: string, sortBy?: string, sortDir?: 'asc'|'desc' }} [opts]
 */
export async function listListings(agentId, opts = {}) {
  if (!agentId) return [];
  let query = supabase
    .from('listings')
    .select('*')
    .eq('agent_id', agentId);

  if (opts.category) query = query.eq('category', opts.category);
  if (opts.status)   query = query.eq('status', opts.status);
  if (opts.search) {
    const term = `%${opts.search}%`;
    query = query.or(`title.ilike.${term},location.ilike.${term}`);
  }

  const col = opts.sortBy || 'created_at';
  const asc = opts.sortDir === 'asc';
  query = query.order(col, { ascending: asc });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

const toPayload = (fields) => ({
  title:       fields.title,
  rent:        fields.rent === '' || fields.rent == null ? null : Number(fields.rent),
  location:    fields.location    || null,
  beds:        fields.beds        || null,
  rules:       fields.rules       || null,
  contact:     fields.contact     || null,
  // new fields
  category:    fields.category    || null,
  status:      fields.status      || 'available',
  description: fields.description || null,
  bathrooms:   fields.bathrooms   || null,
  floor_area:  fields.floor_area  || null,
  amenities:   fields.amenities   || null,
  photo_urls:  Array.isArray(fields.photo_urls) ? fields.photo_urls : [],
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
