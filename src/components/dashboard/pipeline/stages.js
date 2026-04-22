export const STAGES = [
  {
    id: 'inquiry',
    title: 'Inquiry',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    accent: 'border-t-slate-400',
    tab: 'data-[active=true]:bg-slate-100 data-[active=true]:text-slate-700 dark:data-[active=true]:bg-slate-700 dark:data-[active=true]:text-slate-200',
  },
  {
    id: 'contacted',
    title: 'Contacted',
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accent: 'border-t-blue-400',
    tab: 'data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 dark:data-[active=true]:bg-blue-900/30 dark:data-[active=true]:text-blue-400',
  },
  {
    id: 'viewing',
    title: 'Viewing',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    accent: 'border-t-amber-400',
    tab: 'data-[active=true]:bg-amber-100 data-[active=true]:text-amber-700 dark:data-[active=true]:bg-amber-900/30 dark:data-[active=true]:text-amber-400',
  },
  {
    id: 'reserved',
    title: 'Reserved',
    dot: 'bg-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accent: 'border-t-purple-400',
    tab: 'data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 dark:data-[active=true]:bg-purple-900/30 dark:data-[active=true]:text-purple-400',
  },
  {
    id: 'closed',
    title: 'Closed',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    accent: 'border-t-emerald-400',
    tab: 'data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 dark:data-[active=true]:bg-emerald-900/30 dark:data-[active=true]:text-emerald-400',
  },
];

export const getStage = (id) => STAGES.find((s) => s.id === id);
