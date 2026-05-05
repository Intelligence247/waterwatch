import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const config: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; iconColor: string }> = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200/60', iconColor: 'text-emerald-600' },
    error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200/60', iconColor: 'text-red-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200/60', iconColor: 'text-amber-600' },
  };
  const cfg = config[toast.type];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg ${cfg.bg} ${cfg.border} animate-slide-in`}
    >
      <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-slate-800 flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 rounded hover:bg-black/5 text-slate-400 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
