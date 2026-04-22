import { STAGES } from './stages';

export default function StageTabs({ active, counts, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Pipeline stages"
      className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
    >
      {STAGES.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            onClick={() => onChange(s.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-colors
              bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800
              ${s.tab}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span>{s.title}</span>
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                isActive ? s.badge : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts[s.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
