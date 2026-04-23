import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Search, ShieldAlert, CheckCircle2, Clock, Trash2, RefreshCw, Zap, KeyRound, Mail as MailIcon, Eye, X, MoreVertical, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { setConnectionsEnabled } from '../../lib/connections';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

const VALID_STATUS_FILTERS = ['all', 'pending', 'active', 'suspended'];
const VALID_ROLE_FILTERS = ['all', 'agent', 'admin'];

export default function AdminAccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = VALID_STATUS_FILTERS.includes(searchParams.get('status')) ? searchParams.get('status') : 'all';
  const initialRole = VALID_ROLE_FILTERS.includes(searchParams.get('role')) ? searchParams.get('role') : 'all';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialStatus);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filter === 'all') next.delete('status'); else next.set('status', filter);
    if (roleFilter === 'all') next.delete('role'); else next.set('role', roleFilter);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, roleFilter]);
  const [openMenuUserId, setOpenMenuUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerMode, setDrawerMode] = useState('view');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || users.length === 0) return;
    const target = users.find((u) => u.id === viewId);
    if (target) {
      setSelectedUser(target);
      setDrawerMode('view');
    }
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  useEffect(() => {
    if (selectedUser) {
      const id = requestAnimationFrame(() => setDrawerVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setDrawerVisible(false);
  }, [selectedUser]);

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, location, role, status, created_at, connections_enabled, temp_password_required')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setUsers([]);
      toast.error(`Failed to load users: ${fetchError.message}`);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id, status) => {
    const { error: updErr } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (updErr) {
      toast.error(`Failed to update status: ${updErr.message}`);
      return;
    }
    const target = users.find((u) => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, status } : prev));
    toast.success(`${target?.name || 'User'} status set to ${status}.`);

    if (status === 'active' && target?.status === 'pending' && target?.email) {
      // Send the "you've been approved" email via Resend through our Vercel
      // serverless function. Requires an authenticated admin bearer token so
      // the API can verify the caller before emailing arbitrary users.
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          toast.warning('Approved, but could not send email: session missing.');
        } else {
          const res = await fetch('/api/notify-user-approved', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ userId: id }),
          });
          if (res.ok) {
            toast.info(`Approval email sent to ${target.email}.`);
          } else {
            const body = await res.json().catch(() => ({}));
            toast.warning(`Approved, but email notification failed: ${body.error || res.status}`);
          }
        }
      } catch (e) {
        toast.warning(`Approved, but email notification failed: ${e.message}`);
      }
    }
  };

  const sendResetEmail = async (target) => {
    if (!target?.email) {
      toast.warning('No email found for this user.');
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      toast.error(`Failed to send reset email: ${resetError.message}`);
      return;
    }
    toast.success(`Password reset email sent to ${target.email}.`);
  };

  const setTemporaryPassword = async (target) => {
    const ok = await confirm({
      title: 'Set temporary password',
      message: `Generate a temporary password for ${target?.name || 'this user'}?`,
      confirmText: 'Generate',
      cancelText: 'Cancel',
      variant: 'warning',
    });
    if (!ok) {
      toast.warning('Temporary password action cancelled.');
      return;
    }

    const tempPassword = `Corevia-${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}!`;
    const { error: rpcError } = await supabase.rpc('admin_set_temporary_password', {
      target_user_id: target.id,
      temporary_password: tempPassword,
    });
    if (rpcError) {
      toast.error(`Failed to set temporary password: ${rpcError.message}`);
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, temp_password_required: true } : u)));
    await navigator.clipboard.writeText(tempPassword);
    toast.success(`Temporary password generated and copied for ${target.name || 'user'}.`);
  };

  const updateRole = async (id, role) => {
    const { error: updErr } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (updErr) {
      toast.error(`Failed to update role: ${updErr.message}`);
      return;
    }
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, role } : prev));
    toast.success(`${target?.name || 'User'} role set to ${role}.`);
  };

  const toggleConnections = async (id, next) => {
    try {
      await setConnectionsEnabled(id, next);
      const target = users.find((u) => u.id === id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, connections_enabled: next } : u));
      setSelectedUser((prev) => (prev?.id === id ? { ...prev, connections_enabled: next } : prev));
      toast.info(`${target?.name || 'User'} connections ${next ? 'enabled' : 'disabled'}.`);
    } catch (e) {
      toast.error(`Failed to toggle connections: ${e.message}`);
    }
  };

  const deleteUser = async (id) => {
    const shouldDelete = await confirm({
      title: 'Delete user',
      message: 'Are you sure you want to permanently delete this user?',
      confirmText: 'Delete',
      cancelText: 'Keep User',
      variant: 'danger',
    });
    if (!shouldDelete) {
      toast.warning('Delete action cancelled.');
      return false;
    }
    const target = users.find((u) => u.id === id);
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', id);
    if (delErr) {
      toast.error(`Failed to delete user: ${delErr.message}`);
      return false;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success(`${target?.name || 'User'} deleted.`);
    return true;
  };

  const openDetails = (user, mode) => {
    setSelectedUser(user);
    setDrawerMode(mode);
    setOpenMenuUserId('');
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const haystack = [
      u.name,
      u.email,
      u.location,
      u.phone,
      u.id,
      u.role,
      u.status,
      u.connections_enabled ? 'connections on' : 'connections off',
      new Date(u.created_at).toLocaleDateString(),
    ].join(' ').toLowerCase();
    const matchSearch = haystack.includes(q);
    const matchFilter = filter === 'all' || u.status === filter;
    const matchRole = roleFilter === 'all' || (u.role || 'agent') === roleFilter;
    return matchSearch && matchFilter && matchRole;
  });

  const sorted = [...filtered].sort((a, b) => {
    let left = a[sortBy];
    let right = b[sortBy];

    if (sortBy === 'created_at') {
      left = new Date(a.created_at).getTime();
      right = new Date(b.created_at).getTime();
    }

    if (typeof left === 'string') left = left.toLowerCase();
    if (typeof right === 'string') right = right.toLowerCase();

    if (left < right) return sortDir === 'asc' ? -1 : 1;
    if (left > right) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const statusBadge = (status) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  };

  const statusIcon = (status) => {
    if (status === 'active') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'pending') return <Clock className="w-3 h-3" />;
    return <ShieldAlert className="w-3 h-3" />;
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const statusCounts = {
    all: users.length,
    pending: users.filter((u) => u.status === 'pending').length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {pendingCount} signup request{pendingCount === 1 ? '' : 's'} pending review. Approve to activate and notify users.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Control</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Approve signups, manage access, and reset credentials.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search all columns…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 outline-none w-56 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300"
              title="Sort column"
            >
              <option value="created_at">Sort: Joined Date</option>
              <option value="name">Sort: Name</option>
              <option value="email">Sort: Email</option>
              <option value="role">Sort: Role</option>
              <option value="status">Sort: Status</option>
            </select>
            <button
              onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
              title="Toggle sort direction"
            >
              {sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </button>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300"
              title="Filter by role"
            >
              <option value="all">Role: All</option>
              <option value="agent">Role: Agent</option>
              <option value="admin">Role: Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'active', 'suspended'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-slate-900 dark:bg-brand-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {f} <span className="ml-1 opacity-80">({statusCounts[f]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[980px]">
            <thead className="bg-slate-800 text-slate-100 border-b border-slate-700 dark:bg-black dark:text-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Access</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-rose-500">{error}</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No users found.</td></tr>
              ) : sorted.map((user, idx) => (
                <tr key={user.id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40'} hover:bg-slate-100 dark:hover:bg-slate-800/70`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-200">{user.name || '—'}</div>
                    {user.temp_password_required && (
                      <div className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">Must change temp password</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400 dark:text-slate-500">{user.id.slice(0, 8)}…</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email || 'No email'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                      {user.role || 'agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(user.status)}`}>
                      {statusIcon(user.status)} {user.status ?? 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      {user.connections_enabled ? 'Connections On' : 'Connections Off'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center justify-end">
                      <button
                        onClick={() => setOpenMenuUserId((prev) => (prev === user.id ? '' : user.id))}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuUserId === user.id && (
                        <div className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                          <button
                            onClick={() => openDetails(user, 'view')}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={() => openDetails(user, 'edit')}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createPortal(
      <div className={`fixed inset-0 z-[9999] flex justify-end transition-all duration-300 ${drawerVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeDrawer}
        />
        <div className={`relative w-96 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedUser && (
            <>
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-6 pt-6 pb-5 relative flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-lg">{selectedUser.name || 'User details'}</h2>
                  <button onClick={closeDrawer} className="text-white/70 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-white/85 text-xs mt-2 font-mono break-all">{selectedUser.id}</p>
                <p className="text-white/70 text-xs mt-1 capitalize">Mode: {drawerMode}</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 flex flex-col gap-3 text-sm">
                  <DetailField label="Email" value={selectedUser.email || 'No email'} />
                  <DetailField label="Phone" value={selectedUser.phone || 'No phone'} />
                  <DetailField label="Location" value={selectedUser.location || 'No location'} />
                  <DetailField label="Joined" value={new Date(selectedUser.created_at).toLocaleString()} />
                  <DetailField label="Role" value={selectedUser.role || 'agent'} />
                  <DetailField label="Status" value={selectedUser.status || 'pending'} />
                </div>

                <div className="px-4 pb-6">
                  {drawerMode === 'view' && selectedUser.status === 'pending' && (
                    <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">This user is pending approval.</p>
                      <button
                        onClick={() => updateStatus(selectedUser.id, 'active')}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        Activate User
                      </button>
                    </div>
                  )}

                  {drawerMode === 'edit' && (
                    <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                        <select
                          value={selectedUser.role || 'agent'}
                          onChange={(e) => updateRole(selectedUser.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
                        >
                          <option value="agent">agent</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateStatus(selectedUser.id, 'active')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => updateStatus(selectedUser.id, 'pending')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => updateStatus(selectedUser.id, 'suspended')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
                          >
                            Suspended
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <FeatureToggle
                      label="Connections"
                      enabled={!!selectedUser.connections_enabled}
                      onChange={(next) => {
                        toggleConnections(selectedUser.id, next);
                        setSelectedUser((prev) => (prev ? { ...prev, connections_enabled: next } : prev));
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => sendResetEmail(selectedUser)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40 transition-colors"
                      title="Send password reset email"
                    >
                      <MailIcon className="w-3.5 h-3.5 inline mr-1" /> Reset Email
                    </button>
                    <button
                      onClick={() => setTemporaryPassword(selectedUser)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
                      title="Generate temporary password"
                    >
                      <KeyRound className="w-3.5 h-3.5 inline mr-1" /> Temp Password
                    </button>
                    <button
                      onClick={async () => {
                        const deleted = await deleteUser(selectedUser.id);
                        if (deleted) {
                          closeDrawer();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete User
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>,
      document.body
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-900 dark:text-slate-100 break-all">{value}</p>
    </div>
  );
}

function FeatureToggle({ label, enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={`${label}: ${enabled ? 'enabled' : 'disabled'} — click to toggle`}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        enabled
          ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30'
          : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-3.5 rounded-full transition-colors ${
          enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`w-3 h-3 rounded-full bg-white shadow transform transition-transform ${
            enabled ? 'translate-x-1.5' : '-translate-x-1.5'
          }`}
        />
      </span>
      <Zap className="w-3 h-3" />
      {label}
    </button>
  );
}
