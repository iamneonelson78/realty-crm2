/**
 * Listing templates — per-agent custom FB post templates stored in Supabase.
 * Standard templates (from listingPostTemplates.js) are local-only and never deleted.
 */

import { supabase } from './supabaseClient.js';

/**
 * List all custom templates for an agent, ordered by newest.
 * @param {string} agentId
 */
export async function listTemplates(agentId) {
  const { data, error } = await supabase
    .from('listing_templates')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Save a new custom template.
 * @param {string} agentId
 * @param {{ name: string, body: string }} template
 * @returns saved row
 */
export async function createTemplate(agentId, { name, body }) {
  if (!name?.trim() || !body?.trim()) throw new Error('name and body are required');
  const { data, error } = await supabase
    .from('listing_templates')
    .insert({ agent_id: agentId, name: name.trim(), body: body.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a custom template by ID (only if it belongs to the agent).
 * @param {string} id  — template UUID
 */
export async function deleteTemplate(id) {
  const { error } = await supabase.from('listing_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Migrate any templates stored in localStorage (pre-0423 format) to Supabase.
 * Safe to call more than once — already-migrated names are deduplicated server-side.
 * @param {string} agentId
 */
export async function migrateFromLocalStorage(agentId) {
  const key = 'fb_post_templates';
  const raw = localStorage.getItem(key);
  if (!raw) return;

  let local;
  try {
    local = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(local) || local.length === 0) return;

  const existing = await listTemplates(agentId);
  const existingNames = new Set(existing.map((t) => t.name));

  for (const tpl of local) {
    if (tpl.id?.startsWith('template-')) continue; // built-in
    if (!tpl.name || !tpl.body) continue;
    if (existingNames.has(tpl.name)) continue;
    try {
      await createTemplate(agentId, { name: tpl.name, body: tpl.body });
    } catch {
      // non-fatal, move on
    }
  }

  localStorage.removeItem(key); // cleanup
}
