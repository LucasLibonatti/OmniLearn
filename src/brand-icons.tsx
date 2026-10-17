import type { CSSProperties } from 'react';

/**
 * Ícones vetoriais flat/clean em tom roxo, alinhados à identidade do OmniLearn.
 * Substituem as artes 3D (fogo preto/dourado, troféu e foguete realistas) na landing.
 */
export type FlatIconName = 'flame' | 'bolt' | 'sparkles' | 'trend' | 'trophy';

const PATHS: Record<FlatIconName, string> = {
  flame:
    'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
  bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
  sparkles:
    'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
  trend: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
  trophy:
    'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
};

export function FlatIcon({
  name,
  size = 56,
  bare = false,
  className = '',
  style,
}: {
  name: FlatIconName;
  size?: number;
  /** Sem o "chip" de fundo — apenas o glifo roxo. */
  bare?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const gid = `omni-flat-${name}`;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      style={style}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {!bare && <rect x="0.5" y="0.5" width="23" height="23" rx="7.5" fill="#ede9fe" />}
      <g transform="translate(4.5 4.5) scale(0.625)">
        <path d={PATHS[name]} fill={bare ? '#7c3aed' : `url(#${gid})`} />
      </g>
    </svg>
  );
}
