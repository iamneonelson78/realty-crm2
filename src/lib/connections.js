import { supabase } from './supabaseClient';

// Bound every Supabase query with an explicit client-side timeout so a stalled
// connection can't leave the Connections page stuck on its loading spinner.
// 10s is long enough for the slowest healthy response, short enough that users
// see an error they can act on instead of a frozen UI.
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms / 1000}s — please retry.`)),
        ms,
      ),
    ),
  ]);
}

export async function listConnections(agentId) {
  if (!agentId) return [];
  const { data, error } = await withTimeout(
    supabase.from('connections').select('*').eq('agent_id', agentId),
    10000,
    'Loading connections',
  );
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
  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .select('connections_enabled')
      .eq('id', agentId)
      .single(),
    10000,
    'Checking connections flag',
  );
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
