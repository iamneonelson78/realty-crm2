import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

function clearSupabaseStorage() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith('sb-') || k.includes('supabase.auth'))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // non-critical
  }
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — check your network or Supabase status.`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, status, connections_enabled, email, phone, location, avatar_url, temp_password_required')
      .eq('id', authUser.id)
      .single();
    if (error) {
      console.error('Failed to load profile for', authUser.id, error);
      setUser({ ...authUser, role: 'agent', status: 'pending', connections_enabled: false, temp_password_required: false });
      return;
    }
    setUser({ ...authUser, ...data });
  }, []);

  useEffect(() => {
    let resolved = false;
    const finish = () => { resolved = true; setLoading(false); };

    withTimeout(supabase.auth.getSession(), 6000, 'Auth init')
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          withTimeout(fetchProfile(session.user), 8000, 'Profile load')
            .catch(async (err) => {
              console.warn('Profile load failed, clearing stale session:', err?.message);
              await supabase.auth.signOut().catch(() => {});
              clearSupabaseStorage();
            })
            .finally(finish);
        } else {
          finish();
        }
      })
      .catch(async (err) => {
        console.warn('Auth init failed, clearing stale session:', err?.message || err);
        // Sign out locally (no network call) to reset SDK in-memory state,
        // then clear storage. Without the signOut, a subsequent signInWithPassword
        // can still hang because the SDK's internal session object is dirty.
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        clearSupabaseStorage();
        finish();
      });

    // Backstop in case both the SDK call AND our timeout somehow fail to settle.
    const safety = setTimeout(() => {
      if (!resolved) {
        console.warn('Auth init backstop fired; unblocking UI.');
        finish();
      }
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
      }
      finish();
    });

    return () => {
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email, password) => {
    const attempt = async () => {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
        'Login'
      );
      if (error) throw error;
      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('role, status, temp_password_required')
          .eq('id', data.user.id)
          .single(),
        10000,
        'Profile lookup'
      );
      if (profileError) throw profileError;
      if (profile.status === 'pending') {
        await withTimeout(supabase.auth.signOut(), 5000, 'Sign out').catch(() => {});
        throw new Error('Your signup is pending admin review. You will receive an email within 1-2 hours once approved.');
      }
      if (profile.status === 'suspended') {
        await withTimeout(supabase.auth.signOut(), 5000, 'Sign out').catch(() => {});
        throw new Error('Your account has been suspended. Please contact an administrator.');
      }
      return {
        ...data,
        user: {
          ...data.user,
          role: profile.role,
          status: profile.status,
          temp_password_required: !!profile.temp_password_required,
        },
      };
    };

    const isNetworkOrTimeout = (err) =>
      err?.name === 'AbortError' ||
      err?.message?.includes('timed out') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError');

    try {
      return await attempt();
    } catch (err) {
      if (!isNetworkOrTimeout(err)) throw err;
      // Stale token or lock contention caused the hang. Reset SDK state (local
      // only — no network call) and retry once. This is equivalent to what
      // opening incognito achieves, but transparent to the user.
      console.warn('[login] Network/timeout error; resetting stale session and retrying once.', err?.message);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      clearSupabaseStorage();
      try {
        return await attempt();
      } catch (retryErr) {
        if (isNetworkOrTimeout(retryErr)) {
          throw new Error(
            'Your browser had a stale session that has been reset. Please try logging in again.'
          );
        }
        throw retryErr;
      }
    }
  };

  const signup = async (email, password, fullName) => {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'agent' } },
      }),
      15000,
      'Signup'
    );
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    // Force-clear all Supabase auth storage regardless of signOut result.
    // This ensures stale tokens don't survive an F5 and cause login hangs.
    clearSupabaseStorage();
    // Hard reload: creates a fresh JS context and Supabase client instance,
    // equivalent to what opening incognito achieves.
    window.location.assign('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, loading, setUser }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading Realty CRM...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
