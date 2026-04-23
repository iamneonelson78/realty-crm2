import { useEffect, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, MoreHorizontal, ArrowRight, Check } from 'lucide-react';
import { STAGES } from './stages';

const REASON_STYLE = {
  'Closed Won':  'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  'Closed Lost': 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30',
  'Cancelled':   'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  'Duplicate':   'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
};

export default function LeadCard({ lead, onMove, draggable = true }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { leadId: lead.id, fromStage: lead.status },
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const isCancelled = lead.close_reason === 'Cancelled';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div
        {...(draggable ? listeners : {})}
        {...attributes}
        className={`p-4 ${draggable ? 'md:cursor-grab md:active:cursor-grabbing' : ''} touch-none select-none`}
      >
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
            <h4 className={`font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight ${isCancelled ? 'line-through opacity-50' : ''}`}>
              {lead.name}
            </h4>
            {lead.status === 'closed' && lead.close_reason && (
              <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${REASON_STYLE[lead.close_reason] ?? REASON_STYLE['Duplicate']}`}>
                {lead.close_reason}
              </span>
            )}
          </div>
        </div>

        <span className={`inline-flex max-w-full items-center text-[11px] font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800/50 px-2 py-0.5 rounded-md truncate ${isCancelled ? 'line-through opacity-50' : ''}`}>
          {lead.unit}
        </span>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <a
            href={`https://${lead.messenger}`}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors min-h-[32px]"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </a>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{lead.time}</span>
        </div>
      </div>

      <MoveMenu lead={lead} onMove={onMove} />
    </div>
  );
}

function MoveMenu({ lead, onMove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  return (
    <div ref={ref} className="absolute top-2 right-2">
      <button
        type="button"
        aria-label="Move lead"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Move to
          </div>
          {STAGES.map((s) => {
            const current = s.id === lead.status;
            return (
              <button
                key={s.id}
                type="button"
                disabled={current}
                onClick={() => {
                  if (!current) onMove(lead.id, s.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  current
                    ? 'text-slate-400 dark:text-slate-500 cursor-default'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="flex-1">{s.title}</span>
                {current ? (
                  <Check className="w-3.5 h-3.5 text-brand-500" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
