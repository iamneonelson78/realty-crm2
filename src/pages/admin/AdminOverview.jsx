import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Database, ArrowUpRight, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminOverview() {
  const [counts, setCounts] = useState({ agents: 0, leads: 0, pending: 0, openFeedback: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, leadsRes, pendingRes, recentRes, feedbackRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'agent'),
          supabase.from('leads').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('profiles').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('feedback').select('id', { count: 'exact' }).eq('status', 'open'),
        ]);
        setCounts({
          agents: agentsRes.count ?? 0,
          leads: leadsRes.count ?? 0,
          pending: pendingRes.count ?? 0,
          openFeedback: feedbackRes.count ?? 0,
        });
        setActivity(recentRes.data ?? []);
      } catch (e) {
        console.warn('Admin overview fetch failed:', e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const metrics = [
    {
      label: 'Total Registered Agents',
      value: counts.agents,
      icon: <Users className="text-blue-500 dark:text-blue-400 w-5 h-5" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      to: '/admin/access?role=agent',
    },
    {
      label: 'System-wide Leads',
      value: counts.leads,
      icon: <Database className="text-purple-500 dark:text-purple-400 w-5 h-5" />,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      to: null,
    },
    {
      label: 'Pending Approvals',
      value: counts.pending,
      icon: <Clock className="text-amber-500 dark:text-amber-400 w-5 h-5" />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      to: '/admin/access?status=pending',
    },
    {
      label: 'Open Feedback',
      value: counts.openFeedback,
      icon: <MessageSquare className="text-rose-500 dark:text-rose-400 w-5 h-5" />,
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      to: '/admin/feedback',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">High level system metrics and health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => {
          const cardInner = (
            <>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 ${m.bg} rounded-lg`}>
                  {m.icon}
                </div>
                <ArrowUpRight className={`w-4 h-4 ${m.to ? 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400' : 'text-slate-300 dark:text-slate-600'} transition-colors`} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {loading ? '—' : m.value}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{m.label}</p>
            </>
          );

          const baseClasses = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm block';

          return m.to ? (
            <Link
              key={i}
              to={m.to}
              className={`${baseClasses} group transition-all hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md hover:-translate-y-0.5`}
            >
              {cardInner}
            </Link>
          ) : (
            <div key={i} className={baseClasses}>
              {cardInner}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Recent Signups</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-400">No recent activity.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {activity.map((a, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-4 py-3 ${
                  i % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <div>
                  <Link
                    to={`/admin/access?edit=${a.id}`}
                    className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
                  >
                    {a.name || 'Unnamed Agent'}
                  </Link>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    a.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>{a.status}</span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
