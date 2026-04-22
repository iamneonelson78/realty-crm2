import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!dialog) return;
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [dialog]);

  const close = useCallback((result) => {
    setVisible(false);
    window.setTimeout(() => {
      setDialog((prev) => {
        if (prev?.resolve) prev.resolve(result);
        return null;
      });
    }, 170);
  }, []);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    return new Promise((resolve) => {
      setDialog({
        title: opts.title || 'Please confirm',
        message: opts.message || 'Are you sure you want to continue?',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        variant: opts.variant || 'warning',
        resolve,
      });
    });
  }, []);

  const api = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={api}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            className={`absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => close(false)}
            aria-label="Close confirmation"
          />
          <div className={`relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl transition-all duration-150 dark:border-slate-800 dark:bg-slate-900 ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${dialog.variant === 'danger' ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                <AlertTriangle className={`h-4 w-4 ${dialog.variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">{dialog.title}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dialog.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${dialog.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return ctx;
}
