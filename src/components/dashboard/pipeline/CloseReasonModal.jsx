import { X } from 'lucide-react';
import { CLOSE_REASONS } from '../../../lib/leads';

const REASON_META = {
  'Closed Won':  { color: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'Closed Lost': { color: 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
  'Cancelled':   { color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  'Duplicate':   { color: 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
};

export default function CloseReasonModal({ lead, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-base">Close Lead</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">{lead.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason options */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            What was the outcome?
          </p>
          {CLOSE_REASONS.map((reason) => {
            const meta = REASON_META[reason];
            return (
              <button
                key={reason}
                onClick={() => onConfirm(reason)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${meta.color}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                {reason}
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={onCancel}
            className="w-full py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Cancel — keep lead open
          </button>
        </div>
      </div>
    </div>
  );
}
