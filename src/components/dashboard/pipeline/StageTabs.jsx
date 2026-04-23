import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STAGES } from './stages';

export default function StageTabs({ active, counts, onChange }) {
  const idx = STAGES.findIndex((s) => s.id === active);
  const current = STAGES[idx] ?? STAGES[0];
  const prev = STAGES[idx - 1];
  const next = STAGES[idx + 1];

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Prev arrow */}
      <button
        onClick={() => prev && onChange(prev.id)}
        disabled={!prev}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-default transition-colors shrink-0"
        aria-label="Previous stage"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Center: current stage */}
      <div className="flex-1 text-center">
        <div className="inline-flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
          <span className={`w-2.5 h-2.5 rounded-full ${current.dot}`} />
          {current.title}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${current.badge}`}>
            {counts[current.id] ?? 0}
          </span>
        </div>
        {/* Dot position indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              aria-label={s.title}
              className={`rounded-full transition-all ${
                i === idx
                  ? `w-4 h-1.5 ${current.dot}`
                  : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Next arrow */}
      <button
        onClick={() => next && onChange(next.id)}
        disabled={!next}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-default transition-colors shrink-0"
        aria-label="Next stage"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
