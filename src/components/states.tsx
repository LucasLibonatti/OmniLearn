import { useEffect, useState, type ReactNode } from 'react';
import { Bar, Btn, Card } from '../ui';

export const Spinner = ({ label }: { label?: string }) => (
  <div className="grid place-items-center py-12 gap-3 text-slate-500">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
    {label && <p className="text-sm">{label}</p>}
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
);

export function Generating({ label, startedAt }: { label: string; startedAt: number }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [startedAt]);
  const pct = Math.min(96, Math.round(96 * (1 - Math.exp(-secs / 25))));
  const mm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <Card className="fade">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-slate-500">Geralmente leva de 30s a 2 minutos. Não feche esta página.</p>
        </div>
        <span className="font-mono font-bold text-slate-500 shrink-0">{mm}</span>
      </div>
      <div className="mt-3">
        <Bar v={pct} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{pct}% concluído</p>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="text-center">
      <p className="text-2xl">⚠️</p>
      <p className="font-semibold text-slate-700 mt-2">Algo deu errado</p>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
      {onRetry && (
        <Btn className="mt-4" onClick={onRetry}>
          Tentar de novo
        </Btn>
      )}
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center py-10">
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="font-bold text-lg mt-3">{title}</h3>
      {desc && <p className="text-slate-600 mt-1">{desc}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}
