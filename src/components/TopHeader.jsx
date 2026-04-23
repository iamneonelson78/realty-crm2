import { Link } from 'react-router-dom';
import { Bell, Moon, Sun, LogOut, X, Camera, Save, Lock, User as UserIcon, Mail, Shield, Phone, MapPin, ImageOff, HelpCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import Logo from './Logo';
import { useEffect, useRef, useState } from 'react';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@getcoreviatechnologies.com';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

function RoleBadge({ role }) {
  if (!role) return null;
  const isAdmin = role === 'admin';
  const RoleIcon = isAdmin ? Shield : UserIcon;
  const cls = isAdmin
    ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
    : 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30';
  return (
    <span
      title={isAdmin ? 'Admin workspace view' : 'Agent workspace view'}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}
    >
      <RoleIcon className="w-3 h-3" />
      {isAdmin ? 'Admin View' : 'Agent View'}
    </span>
  );
}

function EnvironmentBadge() {
  const stage = (import.meta.env.VITE_APP_STAGE || 'Development').trim();
  const normalized = stage.toLowerCase();

  if (normalized === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }

  if (normalized === 'uat') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
        UAT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-black text-white border-black dark:bg-black dark:text-white dark:border-slate-700">
      Development
    </span>
  );
}

export default function TopHeader() {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState('faq');
  const [helpSending, setHelpSending] = useState(false);
  const [helpForm, setHelpForm] = useState({ title: '', message: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  const initials = (user?.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    location: user?.user_metadata?.location || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    const cached = window.localStorage.getItem(`realty:avatar:${user.id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarUrl(user?.user_metadata?.avatar_url || cached || '');
  }, [user?.id, user?.user_metadata?.avatar_url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      location: user?.user_metadata?.location || '',
    });
  }, [user?.name, user?.email, user?.user_metadata?.phone, user?.user_metadata?.location]);

  const triggerAvatarPicker = () => {
    fileInputRef.current?.click();
  };

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Avatar must be 2MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = String(reader.result || '');
      setAvatarUrl(next);
      if (user?.id) {
        window.localStorage.setItem(`realty:avatar:${user.id}`, next);
      }
      toast.success('Avatar updated. Save profile to apply account-wide.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAvatar = () => {
    setAvatarUrl('');
    if (user?.id) {
      window.localStorage.removeItem(`realty:avatar:${user.id}`);
    }
    toast.info('Avatar removed. Save profile to apply account-wide.');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updates = {
        full_name: form.name,
        phone: form.phone,
        location: form.location,
        avatar_url: avatarUrl || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          location: form.location || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Update local state and show success immediately — profiles table is source of truth.
      setUser((prev) => ({
        ...prev,
        name: form.name,
        user_metadata: {
          ...(prev?.user_metadata || {}),
          ...updates,
        },
      }));

      toast.success('Profile saved.');
      setSavingProfile(false);

      // Sync auth metadata in background — non-critical, don't block the UI.
      withTimeout(supabase.auth.updateUser({ data: updates }), 8000)
        .catch((err) => console.warn('Auth metadata sync failed (non-critical):', err?.message));
    } catch (err) {
      toast.error(`Failed to save profile: ${err.message}`);
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      toast.warning('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await withTimeout(supabase.auth.updateUser({ password: passwordForm.newPassword }), 12000);
      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ temp_password_required: false })
        .eq('id', user.id);
      if (profileError) throw profileError;

      setUser((prev) => ({ ...prev, temp_password_required: false }));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated.');
    } catch (err) {
      const msg = err.message?.includes('timed out')
        ? 'Request timed out. Please try again.'
        : `Failed to update password: ${err.message}`;
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleHelpSubmit = (e) => {
    e.preventDefault();
    const title = helpForm.title.trim();
    const message = helpForm.message.trim();

    if (!title || !message) {
      toast.warning('Please add both title and message.');
      return;
    }

    setHelpSending(true);
    try {
      const subject = encodeURIComponent(title);
      const body = encodeURIComponent(
        `${message}\n\n---\nFrom: ${user?.name || 'Unknown user'} (${user?.email || 'no-email'})\nRole: ${user?.role || 'agent'}`,
      );
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setHelpForm({ title: '', message: '' });
      setHelpOpen(false);
      toast.success('Opening your email app to contact support.');
    } catch {
      toast.error(`Unable to open email app. Please contact ${SUPPORT_EMAIL}.`);
    } finally {
      setHelpSending(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 w-full z-40 transition-colors shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Realty <span className="text-brand-600 dark:text-brand-400">CRM</span></span>
          </Link>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2 ml-1">
            <RoleBadge role={user?.role} />
            <EnvironmentBadge />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setProfileOpen(false);
              setHelpOpen(true);
            }}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
          </button>

          <button
            onClick={() => {
              setHelpOpen(false);
              if (user?.temp_password_required) setActiveTab('password');
              setProfileOpen(true);
            }}
            className="flex items-center gap-2 ml-1 p-1 pl-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.name || 'Agent'}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{initials}</span>
              )}
            </div>
          </button>
        </div>
      </header>

      {/* Help Blade */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${helpOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${helpOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setHelpOpen(false)}
        />
        <div className={`relative w-96 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${helpOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 px-6 pt-6 pb-5 relative flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Help Center</h2>
              <button onClick={() => setHelpOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/85 text-sm mt-2">Find quick answers or message the developer team.</p>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHelpTab('faq')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${helpTab === 'faq' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                FAQs
              </button>
              <button
                type="button"
                onClick={() => setHelpTab('contact')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${helpTab === 'contact' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                Contact Developer
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {helpTab === 'faq' ? (
              <>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">How do I enable Connections?</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Ask your admin to switch your Connections access to On in Admin Access Control.</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">How do I change my password?</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Open your profile menu in the top-right, then use the Change Password tab.</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Need something else?</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Send us a direct message and include steps or screenshots if possible.</p>
                  <button
                    type="button"
                    onClick={() => setHelpTab('contact')}
                    className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Contact developer
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleHelpSubmit} className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={helpForm.title}
                    onChange={(e) => setHelpForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Short summary of your concern"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Message</label>
                  <textarea
                    rows={6}
                    value={helpForm.message}
                    onChange={(e) => setHelpForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us what happened and what you expected."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">This will email: {SUPPORT_EMAIL}</div>

                <button
                  type="submit"
                  disabled={helpSending}
                  className="w-full py-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors text-sm bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white"
                >
                  <Send className="w-4 h-4" />
                  {helpSending ? 'Preparing message...' : 'Send to developer'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Profile Blade */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${profileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${profileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setProfileOpen(false)}
        />
        <div className={`relative w-96 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${profileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />

          {/* Header banner */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-6 pt-6 pb-14 relative flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">My Profile</h2>
              <button onClick={() => setProfileOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 shadow-lg flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile avatar" className="w-full h-full rounded-[14px] object-cover" />
                  ) : (
                    <span className="text-white font-bold text-3xl">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={triggerAvatarPicker}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 hover:bg-brand-50 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-600" />
                </button>
              </div>
              <div>
                <p className="text-white font-semibold text-base">{user?.name || 'Agent'}</p>
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full capitalize mt-1">
                  <Shield className="w-3 h-3" /> {user?.role || 'agent'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 -mt-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'password' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4 space-y-5">
            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-brand-500" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Personal Info</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                    >
                      <ImageOff className="w-3.5 h-3.5" /> Remove Avatar
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email" value={form.email}
                          readOnly
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 pl-8 pr-3 py-2 text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel" value={form.phone} placeholder="+63 9XX XXX XXXX"
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text" value={form.location} placeholder="Metro Manila, PH"
                          onChange={e => setForm({ ...form, location: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 rounded-xl font-semibold flex justify-center items-center gap-2 transition-all shadow-md text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white shadow-brand-500/20"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-5">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Change Password</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
                      <input
                        type="password" value={passwordForm.currentPassword} placeholder="••••••••"
                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Password</label>
                      <input
                        type="password" value={passwordForm.newPassword} placeholder="At least 8 characters"
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirm New Password</label>
                      <input
                        type="password" value={passwordForm.confirmPassword} placeholder="Repeat new password"
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-3 rounded-xl font-semibold flex justify-center items-center gap-2 transition-all shadow-md text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white shadow-brand-500/20"
                >
                  <Save className="w-4 h-4" />
                  {savingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            <button
              onClick={() => { setProfileOpen(false); logout(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 font-medium text-sm transition-colors border border-rose-100 dark:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
