import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import FeedbackWidget from '../components/FeedbackWidget';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });
  const navigate = useNavigate();
  const { signup } = useAuth();

  useEffect(() => {
    const handleResize = () => setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signup(email, password, name);
      setShowConfetti(true);
      setSignupSuccess(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Fire-and-forget admin notification. Delayed 2.5 s so the DB trigger
      // has time to create the profiles row before the API looks it up.
      const newUserId = result?.user?.id;
      if (newUserId) {
        setTimeout(() => {
          fetch('/api/notify-admin-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: newUserId }),
          }).catch((err) => console.warn('notify-admin-signup failed:', err));
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', {
      state: {
        message: 'Signup submitted. Admin will review your account first. You should receive an approval email within 1-2 hours.',
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 py-12 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={300}
          className="!fixed !inset-0 !z-50"
        />
      )}

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-300/30 dark:bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-black/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <Logo className="w-10 h-10 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Realty <span className="text-brand-600 dark:text-brand-400">CRM</span></span>
            </Link>
          </div>

          {signupSuccess ? (
            <div className="text-center animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Account created!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Welcome to Realty CRM. Your account is pending admin review — you should receive an approval email within 1-2 hours.
              </p>
              <button
                onClick={handleGoToLogin}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                Continue to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Start organizing today</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500">
                    Log in
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 block w-full border-slate-200 dark:border-slate-700 rounded-lg focus:ring-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border p-2.5 outline-none transition-colors"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                </div>

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
                      placeholder="juan@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
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
                      placeholder="Create a strong password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-70 transition-colors"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'} {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Copyright © 2026 — Powered by Corevia Technologies
        </p>
      </div>
    </div>
    <FeedbackWidget />
  );
}
