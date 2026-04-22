export default function Watermark({ fixed = false, className = '' }) {
  const base = fixed
    ? 'fixed bottom-3 right-4 z-40 pointer-events-none'
    : 'mt-4 text-center';

  return (
    <p
      className={`${base} text-xs font-medium text-slate-400/90 dark:text-slate-500 ${className}`}
      aria-label="Powered by Corevia Technologies"
    >
      Powered by Corevia Technologies
    </p>
  );
}
