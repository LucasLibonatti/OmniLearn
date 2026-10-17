import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { iconSrc } from './icons';
import { useAuth } from './auth';
import { useI18n } from './i18n';
import { useSettings } from './hooks/useSettings';

/**
 * Indica que a página está sendo renderizada dentro do Layout do app (usuário logado),
 * em vez do "shell" público. Páginas como Diretrizes/Suporte/Redes usam isso para
 * esconder o cabeçalho público e manter a sidebar.
 */
export const InAppShell = createContext(false);
export const useInAppShell = () => useContext(InAppShell);

export const Card = ({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`rounded-3xl bg-white border border-slate-100 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.18)] p-5 card3d ${className}`}
  >
    {children}
  </div>
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
  const c = `btn3d inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-extrabold transition disabled:opacity-40 ${
    v === 'p'
      ? 'bg-indigo-600 text-white border-b-[#312e81] hover:bg-indigo-500 shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]'
      : 'bg-white text-slate-600 border-b-slate-300 hover:bg-slate-50'
  } ${className}`;
  return to && !disabled ? (
    <Link to={to} className={c}>
      <span className="btn3d-tx">{children}</span>
    </Link>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={c}>
      <span className="btn3d-tx">{children}</span>
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
  placeholder,
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
  const { tr } = useI18n();
  const ph = placeholder ?? tr('Escolha…');
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
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value || ph}</span>
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
              {ph}
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

export const BrandIcon = ({ size = 44, className = '' }: { size?: number; className?: string }) => (
  <img
    src={iconSrc.heroi}
    alt=""
    aria-hidden
    draggable={false}
    style={{ width: size, height: size }}
    className={`inline-block object-contain select-none icon3d ${className}`}
  />
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

export const Logo = () => {
  const { session } = useAuth();
  return (
    <Link to={session ? '/dashboard' : '/'} className="group flex items-center gap-2.5">
      <img
        src={iconSrc.heroi}
        alt="OmniLearn"
        draggable={false}
        className="w-11 h-11 object-contain icon3d transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      />
      <span className="text-xl font-extrabold tracking-tight">OmniLearn</span>
    </Link>
  );
};

/** Seletor de idioma segmentado (PT / EN). */
export const LangSwitch = ({ className = '' }: { className?: string }) => {
  const { lang, setLang, t } = useI18n();
  const base =
    'px-3 py-1.5 rounded-full text-sm font-extrabold transition focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_6px_#4f46e5]';
  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={`inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-sm ${className}`}
    >
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`${base} ${lang === l ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

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
