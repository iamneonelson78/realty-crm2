import { useEffect, useMemo, useState } from 'react';
import { Users, CheckCircle2, PhoneCall, Calendar, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listLeads, relativeTime } from '../../lib/leads';

const stageLabel = {
  inquiry: 'Inquiry',
  contacted: 'Contacted',
  viewing: 'Viewing',
  reserved: 'Reserved',
  closed: 'Closed',
};

export default function Overview() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError('');
    listLeads(user.id)
      .then((rows) => { if (!cancelled) setLeads(rows); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const metrics = useMemo(() => {
    const active = leads.filter((l) => !['closed'].includes(l.status)).length;
    const viewings = leads.filter((l) => l.status === 'viewing').length;
    const closed = leads.filter((l) => l.status === 'closed').length;
    return [
      { label: 'Active Leads', value: active, hint: `${leads.length} total`, color: 'bg-blue-500', path: '/dashboard/pipeline' },
      { label: 'Pending Viewings', value: viewings, hint: viewings ? 'Needs scheduling' : 'None queued', color: 'bg-amber-500', path: '/dashboard/pipeline' },
      { label: 'Closed Deals', value: closed, hint: closed ? 'Keep going!' : 'No closes yet', color: 'bg-emerald-500', path: '/dashboard/pipeline' },
    ];
  }, [leads]);

  const actionItems = useMemo(() => {
    return leads
      .filter((l) => l.status === 'inquiry' || l.status === 'contacted' || l.status === 'viewing')
      .slice(0, 4)
      .map((l) => ({
        id: l.id,
        status: l.status,
        name: l.name,
        unit: l.unit,
        time: relativeTime(l.created_at),
      }));
  }, [leads]);

  const recent = useMemo(() => leads.slice(0, 4), [leads]);

  const greeting = user?.name ? user.name.split(' ')[0] : 'Agent';

  const actionIcon = (status) => {
    if (status === 'viewing') return <Calendar className="w-4 h-4 text-amber-500" />;
    if (status === 'contacted') return <PhoneCall className="w-4 h-4 text-brand-500" />;
    return <Users className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {greeting}!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is what is happening with your properties today.</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-600 dark:text-rose-400">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {metrics.map((m, i) => (
          <Link key={i} to={m.path} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${m.color} -mr-10 -mt-10 group-hover:opacity-40 transition-opacity`}></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{loading ? '…' : m.value}</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                {m.hint}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-500" /> Action Items
            </h3>
            <span className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold px-2 py-1 rounded-full">{actionItems.length} open</span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : actionItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No open leads need follow-up right now.</p>
          ) : (
            <div className="space-y-4">
              {actionItems.map((r) => (
                <Link to="/dashboard/pipeline" key={r.id} className="flex gap-4 items-start group">
                  <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group-hover:border-brand-200 dark:group-hover:border-brand-700 transition-colors">
                    {actionIcon(r.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {stageLabel[r.status]}: {r.name}{r.unit ? ` — ${r.unit}` : ''}
                    </p>
                    <p className="text-xs mt-1 font-medium text-slate-500 dark:text-slate-400">{r.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-inner">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" /> Recent Leads
          </h3>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No leads yet. Add one from the pipeline.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{l.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{l.unit || 'Unassigned unit'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 capitalize">{stageLabel[l.status] || l.status}</span>
                    <p className="text-[10px] text-slate-400 mt-1">{relativeTime(l.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
