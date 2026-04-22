import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    wrap: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    wrap: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-300',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, options = {}) => {
    const id = crypto.randomUUID();
    const ttl = options.ttl ?? (type === 'error' ? 5000 : 3200);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => dismiss(id), ttl);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (message, options) => push('success', message, options),
    error: (message, options) => push('error', message, options),
    warning: (message, options) => push('warning', message, options),
    info: (message, options) => push('info', message, options),
    dismiss,
  }), [dismiss, push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`rounded-xl border px-3 py-2 shadow-sm backdrop-blur ${style.wrap}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
                <p className="text-sm font-medium leading-5">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="ml-auto rounded p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
