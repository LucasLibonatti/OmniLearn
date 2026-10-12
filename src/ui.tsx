import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-3xl bg-white border border-slate-100 shadow-sm p-5 ${className}`}>{children}</div>
);

export const Btn = ({
  to,
  onClick,
  children,
  v = 'p',
  className = '',
  disabled,
  type = 'button',
}: {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
  v?: 'p' | 's';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const c = `inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition active:scale-95 disabled:opacity-40 ${v === 'p' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'} ${className}`;
  return to ? (
    <Link to={to} className={c}>
      {children}
    </Link>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={c}>
      {children}
    </button>
  );
};

export const Bar = ({ v, color = 'bg-indigo-600' }: { v: number; color?: string }) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(v)}
    aria-valuemin={0}
    aria-valuemax={100}
    className="h-2.5 rounded-full bg-slate-100 overflow-hidden"
  >
    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
  </div>
);

export const Ring = ({ v, size = 150 }: { v: number; size?: number }) => {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#4f46e5"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 1s' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold">{Math.round(v)}%</span>
    </div>
  );
};

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
    <span className="grid place-items-center w-9 h-9 rounded-xl bg-indigo-600 text-white">
      <GraduationCap size={20} />
    </span>
    OmniLearn
  </Link>
);

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  className = '',
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return <img src={src} alt={name} style={style} className={`rounded-full object-cover bg-slate-100 ${className}`} />;
  }
  return (
    <div
      aria-hidden
      style={style}
      className={`grid place-items-center rounded-full bg-indigo-600 text-white font-bold ${className}`}
    >
      {initials(name)}
    </div>
  );
}
