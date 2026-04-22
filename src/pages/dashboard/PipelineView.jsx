import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import LeadModal from '../../components/dashboard/LeadModal';
import PipelineBoard from '../../components/dashboard/pipeline/PipelineBoard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listLeads, createLead, updateLeadStatus, relativeTime } from '../../lib/leads';

const decorate = (row) => ({ ...row, time: relativeTime(row.created_at) });

export default function PipelineView() {
  const { user } = useAuth();
  const toast = useToast();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
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
      .then((rows) => { if (!cancelled) setLeads(rows.map(decorate)); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSaveLead = async (newLead) => {
    if (!user?.id) return;
    try {
      const saved = await createLead(user.id, newLead);
      setLeads((prev) => [decorate(saved), ...prev]);
      toast.success('Lead saved.');
    } catch (err) {
      toast.error(`Failed to save lead: ${err.message}`);
    }
  };

  const handleMoveLead = async (leadId, toStage) => {
    const prior = leads;
    setLeads((curr) => curr.map((l) => (l.id === leadId ? { ...l, status: toStage } : l)));
    try {
      await updateLeadStatus(leadId, toStage);
      toast.info(`Lead moved to ${toStage}.`, { ttl: 1800 });
    } catch (err) {
      toast.error(`Failed to move lead: ${err.message}`);
      setLeads(prior);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Pipeline</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Drag cards on desktop, or tap the menu on mobile to move leads between stages.
          </p>
        </div>
        <button
          onClick={() => setIsLeadModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 shadow-sm shadow-brand-500/30 transition-all w-full sm:w-auto hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Fast Lead Entry
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400">Loading leads…</div>
      ) : loadError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-8 text-center text-rose-600 dark:text-rose-400">{loadError}</div>
      ) : (
        <PipelineBoard
          leads={leads}
          onMove={handleMoveLead}
          onAddLead={() => setIsLeadModalOpen(true)}
        />
      )}

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
      />
    </>
  );
}
