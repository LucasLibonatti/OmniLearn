import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, GraduationCap } from 'lucide-react';

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

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Escolha…',
  ariaLabel,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left font-medium text-slate-700 transition hover:border-indigo-400 focus:outline-none disabled:opacity-50"
      >
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value || placeholder}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          <li role="option" aria-selected={value === ''}>
            <button
              type="button"
              onClick={() => choose('')}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-100 ${value === '' ? 'bg-slate-100' : ''}`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((o) => (
            <li key={o} role="option" aria-selected={value === o}>
              <button
                type="button"
                onClick={() => choose(o)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  value === o ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
