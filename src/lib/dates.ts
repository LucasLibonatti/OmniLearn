import { tr } from '../i18n';

// Datas no fuso de São Paulo (America/Sao_Paulo) e formatação amigável.
const SP = 'America/Sao_Paulo';

export function spDate(value: string | Date = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', { timeZone: SP, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function ymdToUTC(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(ymd: string, delta: number): string {
  const d = ymdToUTC(ymd);
  d.setUTCDate(d.getUTCDate() + delta);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function todaySP(): string {
  return spDate(new Date());
}

/** Últimos n dias (incluindo hoje), em ordem cronológica. */
export function lastNDates(n: number): string[] {
  const today = todaySP();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

const WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
export function weekLabel(ymd: string): string {
  return tr(WEEK[ymdToUTC(ymd).getUTCDay()]);
}

/** Quantos dias seguidos (terminando hoje ou ontem) aparecem na lista de datas. */
export function streakFromDates(dates: string[]): number {
  const set = new Set(dates);
  const today = todaySP();
  const yesterday = addDays(today, -1);
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  let count = 0;
  while (cursor && set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** "Hoje", "Ontem", "Há 3 dias" ou "dd/mm". */
export function shortAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ymd = spDate(iso);
  const today = todaySP();
  if (ymd === today) return tr('Hoje');
  if (ymd === addDays(today, -1)) return tr('Ontem');
  const diff = Math.round((ymdToUTC(today).getTime() - ymdToUTC(ymd).getTime()) / 86400000);
  if (diff < 7) return tr('Há {n} dias', { n: diff });
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
}

export function formatDate(iso: string): string {
  const ymd = spDate(iso);
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;
}

export function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: SP, hour: 'numeric', hour12: false }).format(new Date()));
  if (hour < 12) return tr('Bom dia');
  if (hour < 18) return tr('Boa tarde');
  return tr('Boa noite');
}
