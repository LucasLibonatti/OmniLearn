import type { ReactNode } from 'react';
import { Btn, Card } from '../ui';

export const Spinner = ({ label }: { label?: string }) => (
  <div className="grid place-items-center py-12 gap-3 text-slate-500">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
    {label && <p className="text-sm">{label}</p>}
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
);

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
