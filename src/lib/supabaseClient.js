import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const REQUEST_TIMEOUT_MS = 15000;
const LOCK_ACQUIRE_TIMEOUT_MS = 3000;

// Hard ceiling on every Supabase request (auth, Postgrest, RPC, storage).
// Without this, a stalled socket can hang the whole UI indefinitely.
const timedFetch = (input, init = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Supabase request timed out')), REQUEST_TIMEOUT_MS);

  if (init.signal) {
    if (init.signal.aborted) controller.abort(init.signal.reason);
    else init.signal.addEventListener('abort', () => controller.abort(init.signal.reason), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
};

// Bounded replacement for Supabase's default navigator.locks-based lock.
// navigator.locks can get stuck when a tab crashes or closes mid-refresh,
// which blocks getSession()/signInWithPassword() forever on subsequent loads.
// We still serialize with navigator.locks when available, but give up after
// LOCK_ACQUIRE_TIMEOUT_MS and run the critical section anyway — at worst,
// two tabs refresh the token concurrently (the SDK tolerates this).
const boundedLock = async (name, acquireTimeout, fn) => {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) {
    return fn();
  }

  const timeoutMs = Math.min(acquireTimeout ?? LOCK_ACQUIRE_TIMEOUT_MS, LOCK_ACQUIRE_TIMEOUT_MS);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);

  try {
    return await navigator.locks.request(name, { signal: abort.signal }, async () => {
      clearTimeout(timer);
      return fn();
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      console.warn(`[supabase] lock "${name}" not acquired in ${timeoutMs}ms; proceeding without lock.`);
      return fn();
    }
    throw err;
  }
};

// Project-scoped storage key. Prevents collisions when multiple Supabase
// projects are used from the same origin (e.g., switching VITE_SUPABASE_URL
// during development would otherwise leave stale tokens under the shared key).
const projectRef = (() => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || 'default';
  } catch {
    return 'default';
  }
})();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: `sb-${projectRef}-auth-token`,
    lock: boundedLock,
  },
  global: {
    fetch: timedFetch,
  },
});
