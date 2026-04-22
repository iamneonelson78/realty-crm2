import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // 'verifying' -> 'ready' (token valid, user can set new password)
  //             -> 'invalid' (token bad/expired, show error + back-to-login)
  const [stage, setStage] = useState('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!tokenHash || type !== 'recovery') {
        setStage('invalid');
        setError('This reset link is missing required information. Request a new one.');
        return;
      }
      try {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });
        if (cancelled) return;
        if (verifyErr) {
          setStage('invalid');
          setError(verifyErr.message || 'This reset link is invalid or has expired.');
          return;
        }
        setStage('ready');
      } catch (err) {
        if (cancelled) return;
        setStage('invalid');
        setError(err?.message || 'Could not verify reset link.');
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [tokenHash, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateErr) {
      setError(updateErr.message || 'Failed to update password.');
      return;
    }

    // Sign out the recovery session so the user logs in fresh with the new password.
    try { await supabase.auth.signOut(); } catch { /* non-fatal */ }

    toast.success('Password updated. Log in with your new password.');
    navigate('/login', {
      state: { message: 'Your password has been updated. You can log in now.' },
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 py-12 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-300/30 dark:bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-black/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
              <Logo className="w-10 h-10 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Realty <span className="text-brand-600 dark:text-brand-400">CRM</span></span>
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Choose a new password</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pick something strong you haven't used before.</p>
          </div>

          {stage === 'verifying' && (
            <div className="flex flex-col items-center gap-3 py-6 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm">Verifying your reset link…</p>
            </div>
          )}

          {stage === 'invalid' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error || 'This reset link is invalid or has expired.'}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                Back to login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {stage === 'ready' && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-70 transition-colors"
              >
                {submitting ? 'Updating…' : (<>Update password <CheckCircle className="w-4 h-4" /></>)}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Copyright © 2026 — Powered by Corevia Technologies
        </p>
      </div>
    </div>
  );
}
