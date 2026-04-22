import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import LeadCard from './LeadCard';

export default function StageColumn({ stage, leads, onMove, onAddLead }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { stageId: stage.id },
  });

  const showAddLead = stage.id === 'inquiry' && typeof onAddLead === 'function';

  return (
    <div
      className={`min-w-[240px] flex-1 flex flex-col bg-white dark:bg-slate-900/40 rounded-2xl border-t-[3px] ${stage.accent} border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors`}
    >
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{stage.title}</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stage.badge}`}>
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`p-3 flex-1 min-h-[120px] space-y-3 transition-colors ${
          isOver ? 'bg-brand-50/60 dark:bg-brand-900/10' : ''
        }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onMove={onMove} />
        ))}

        {leads.length === 0 && !showAddLead && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No leads here yet
          </div>
        )}

        {showAddLead && (
          <button
            type="button"
            onClick={onAddLead}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors flex justify-center items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        )}
      </div>
    </div>
  );
}
