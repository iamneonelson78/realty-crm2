import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, X, ExternalLink, ChevronDown, Star, Paperclip, Send } from 'lucide-react';
import { listFeedback, updateFeedbackStatus, replyFeedback, getAttachmentUrl, getFeedbackMetrics } from '../../lib/feedback';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['open', 'ongoing', 'replied', 'closed'];
const CATEGORY_OPTIONS = ['Bug', 'Question', 'Suggestion', 'Other'];

const statusColors = {
  open:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  replied: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  closed:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value ?? '—'}</p>
      <p className={`text-sm mt-1 ${color || 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
    </div>
  );
}

export default function AdminFeedback() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterSearch, setFilterSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, m] = await Promise.all([
        listFeedback({ status: filterStatus, category: filterCategory, search: filterSearch }),
        getFeedbackMetrics(),
      ]);
      setItems(rows);
      setMetrics(m);
    } catch (err) {
      toast.error(`Failed to load feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterSearch, toast]);

  useEffect(() => { load(); }, [load]);

  const openDrawer = (item) => {
    setSelected(item);
    setReplyText(item.admin_reply || '');
  };

  const closeDrawer = () => {
    setSelected(null);
    setReplyText('');
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateFeedbackStatus(id, newStatus);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      if (selected?.id === id) setSelected(updated);
      toast.success(`Status set to "${newStatus}"`);
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReply = async (sendEmail) => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      if (sendEmail) {
        await replyFeedback(selected.id, replyText);
        toast.success('Reply saved and email sent.');
      } else {
        // Direct DB update without email
        const { supabase } = await import('../../lib/supabaseClient.js');
        const { data, error } = await supabase
          .from('feedback')
          .update({ admin_reply: replyText.trim(), status: 'replied', updated_at: new Date().toISOString() })
          .eq('id', selected.id)
          .select()
          .single();
        if (error) throw error;
        setItems((prev) => prev.map((i) => (i.id === selected.id ? data : i)));
        setSelected(data);
        toast.success('Reply saved (no email sent).');
        setReplying(false);
        return;
      }
      // Refresh the row
      await load();
      closeDrawer();
    } catch (err) {
      toast.error(err.message || 'Failed to send reply.');
    } finally {
      setReplying(false);
    }
  };

  const toggleFilter = (arr, setArr, val) => {
    setArr((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Triage, reply, and track user feedback submissions.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard label="Total" value={metrics?.total} />
        <MetricCard label="Open" value={metrics?.open} color="text-rose-600 dark:text-rose-400" />
        <MetricCard label="Ongoing" value={metrics?.ongoing} color="text-amber-600 dark:text-amber-400" />
        <MetricCard label="Replied" value={metrics?.replied} color="text-sky-600 dark:text-sky-400" />
        <MetricCard label="Closed" value={metrics?.closed} />
        <MetricCard label="Avg Rating (30d)" value={metrics?.avgRating ? `${metrics.avgRating} ★` : '—'} />
        <MetricCard label="This Week" value={metrics?.thisWeek} />
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleFilter(filterStatus, setFilterStatus, s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus.includes(s) ? statusColors[s] + ' border-transparent' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category:</span>
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggleFilter(filterCategory, setFilterCategory, c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCategory.includes(c) ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search message or email…"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="w-full max-w-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="bg-slate-800 text-slate-100 border-b border-slate-700 dark:bg-black dark:text-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Category / Rating</th>
              <th className="px-4 py-3 font-semibold">Submitter</th>
              <th className="px-4 py-3 font-semibold">Message preview</th>
              <th className="px-4 py-3 font-semibold">Page</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No feedback found.</td></tr>
            ) : items.map((item, idx) => (
              <tr
                key={item.id}
                className={`cursor-pointer transition-colors ${
                  idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40'
                } hover:bg-slate-100 dark:hover:bg-slate-800/70`}
                onClick={() => openDrawer(item)}
              >
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.category || '—'}</span>
                  {item.rating && (
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">
                  {item.email || (item.user_id ? 'Logged-in user' : 'Anonymous')}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[200px]">
                  <span className="text-sm line-clamp-2">{item.message}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 max-w-[100px] truncate">
                  {item.page_url || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || ''}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-400 dark:text-slate-500">
                  {(item.attachments?.length || 0) > 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      <Paperclip className="w-3 h-3" />{item.attachments.length}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Feedback Detail</h3>
              </div>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Meta row */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">{new Date(selected.created_at).toLocaleString()}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selected.category}</span>
                {selected.rating && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="flex gap-0.5 items-center">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= selected.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </span>
                  </>
                )}
                {selected.page_url && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-slate-400 dark:text-slate-500">{selected.page_url}</span>
                  </>
                )}
              </div>

              {/* Submitter */}
              {(selected.email || selected.user_id) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Submitter</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selected.email || 'Authenticated user (no email on record)'}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Message</p>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-700">
                  {selected.message}
                </div>
              </div>

              {/* Attachments */}
              {(selected.attachments?.length || 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Attachments</p>
                  <div className="space-y-2">
                    {selected.attachments.map((att, i) => {
                      const url = getAttachmentUrl(att);
                      const isImage = att.mimeType?.startsWith('image/') || att.mime?.startsWith('image/');
                      return (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                          {isImage && url ? (
                            <img src={url} alt={att.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{att.name}</span>
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status control */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Status</p>
                <div className="relative inline-block">
                  <select
                    value={selected.status || 'open'}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                    className="appearance-none pr-8 pl-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Reply textarea */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Admin Reply</p>
                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply to the submitter…"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                disabled={replying || !replyText.trim()}
                onClick={() => handleReply(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Save without email
              </button>
              <button
                disabled={replying || !replyText.trim()}
                onClick={() => handleReply(true)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md shadow-brand-500/20"
              >
                <Send className="w-4 h-4" /> {replying ? 'Sending…' : 'Save & send reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
