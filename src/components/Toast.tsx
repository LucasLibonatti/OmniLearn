import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (item: ToastItem) => void;
const listeners = new Set<Listener>();
let seq = 0;

function emit(kind: ToastKind, message: string) {
  const item: ToastItem = { id: ++seq, kind, message };
  listeners.forEach((fn) => fn(item));
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
};

const STYLES: Record<ToastKind, { wrap: string; Icon: typeof CheckCircle2; iconCls: string }> = {
  success: {
    wrap: 'bg-white border-emerald-200 text-slate-800',
    Icon: CheckCircle2,
    iconCls: 'text-emerald-500',
  },
  error: {
    wrap: 'bg-white border-red-200 text-slate-800',
    Icon: AlertTriangle,
    iconCls: 'text-red-500',
  },
  info: {
    wrap: 'bg-white border-indigo-200 text-slate-800',
    Icon: Info,
    iconCls: 'text-indigo-500',
  },
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onItem: Listener = (item) => {
      setItems((prev) => [...prev.slice(-2), item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      }, 3400);
    };
    listeners.add(onItem);
    return () => {
      listeners.delete(onItem);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-20 md:bottom-6 right-4 z-[120] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {items.map((item) => {
        const { wrap, Icon, iconCls } = STYLES[item.kind];
        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-lg fade ${wrap}`}
          >
            <Icon size={18} className={`shrink-0 ${iconCls}`} aria-hidden />
            <p className="text-sm font-bold flex-1 leading-snug">{item.message}</p>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
