import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, X, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import FeedbackWidget from '../components/FeedbackWidget';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      const role = result?.user?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotSending(false);
    setForgotSent(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.warning('Please enter your email address.');
      return;
    }
    setForgotSending(true);
    // Fire the reset flow through Supabase. Supabase's Send Email Hook picks
    // this up and forwards to our /api/auth-email-hook, which sends via Resend.
    // Link in the email lands on /reset-password?token_hash=...&type=recovery.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSending(false);
    if (resetError) {
      // Log the real reason for ourselves but still show the generic message to
      // avoid leaking which emails are registered.
      console.warn('resetPasswordForEmail failed:', resetError.message);
    }
    setForgotSent(true);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-300/30 dark:bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-black/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
              <Logo className="w-10 h-10 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Realty <span className="text-brand-600 dark:text-brand-400">CRM</span></span>
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              New here?{' '}
              <Link to="/signup" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500">
                Create an account
              </Link>
            </p>
          </div>

          {infoMessage && (
            <div className="mb-5 p-4 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-medium text-sky-800 dark:text-sky-300">{infoMessage}</p>
              <button
                type="button"
                onClick={() => setInfoMessage('')}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                  placeholder="agent@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-70 transition-colors"
            >
              {isLoading ? 'Authenticating...' : 'Login'} {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500">
              Sign up for free
            </Link>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                try {
                  Object.keys(window.localStorage)
                    .filter((k) => k.startsWith('sb-') || k.includes('supabase.auth'))
                    .forEach((k) => window.localStorage.removeItem(k));
                } catch { /* ignore localStorage errors */ }
                window.location.reload();
              }}
              className="text-xs text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 underline transition-colors"
            >
              Having trouble logging in? Reset session
            </button>
          </div>
        </div>

        <p className="hidden sm:block mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Copyright &copy; 2026 — Powered by Corevia Technologies
        </p>
      </div>

      {/* Mobile-only fixed copyright */}
      <p className="sm:hidden fixed bottom-3 left-0 right-0 text-center text-xs text-slate-400 dark:text-slate-600 pointer-events-none z-30">
        Copyright &copy; 2026 — Powered by Corevia Technologies
      </p>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset your password</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {forgotSent
                    ? 'Check your inbox for the reset link.'
                    : "Enter your email and we'll send you a reset link."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                  We've sent a password reset link to
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-5 break-all">
                  {forgotEmail}
                </p>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full py-2.5 px-4 rounded-full text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                      placeholder="agent@example.com"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSending}
                    className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-70 transition-colors"
                  >
                    {forgotSending ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
    <FeedbackWidget />
    </>
  );
}
