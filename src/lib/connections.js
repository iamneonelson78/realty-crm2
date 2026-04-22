import { supabase } from './supabaseClient';

export async function listConnections(agentId) {
  if (!agentId) return [];
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('agent_id', agentId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertConnection(agentId, platform, patch) {
  if (!agentId) throw new Error('agentId required');
  const payload = {
    agent_id: agentId,
    platform,
    ...patch,
  };
  const { data, error } = await supabase
    .from('connections')
    .upsert(payload, { onConflict: 'agent_id,platform' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setConnectionStatus(agentId, platform, status) {
  return upsertConnection(agentId, platform, {
    status,
    connected_at: status === 'connected' ? new Date().toISOString() : null,
  });
}

export async function getConnectionsEnabled(agentId) {
  if (!agentId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('connections_enabled')
    .eq('id', agentId)
    .single();
  if (error) throw error;
  return !!data?.connections_enabled;
}

export async function setConnectionsEnabled(agentId, enabled) {
  if (!agentId) throw new Error('agentId required');
  const { error } = await supabase
    .from('profiles')
    .update({ connections_enabled: enabled })
    .eq('id', agentId);
  if (error) throw error;
  return enabled;
}

export function getPrimaryMessengerHandle(connections) {
  if (!Array.isArray(connections)) return '';
  const pref = ['messenger', 'whatsapp', 'viber', 'facebook'];
  for (const p of pref) {
    const row = connections.find(
      (c) => c.platform === p && c.status === 'connected' && c.handle,
    );
    if (row) return row.handle;
  }
  return '';
}
