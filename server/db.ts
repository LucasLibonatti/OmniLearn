import { Pool, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Variável de ambiente DATABASE_URL não configurada.');
  }
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  pool = new Pool({
    connectionString: url,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 10_000,
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// ===== Helpers de data em America/Sao_Paulo =====
const SP = 'America/Sao_Paulo';

export function spDate(value: string | Date = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function todaySP(): string {
  return spDate(new Date());
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

export function lastNDates(n: number): string[] {
  const today = todaySP();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

export function startOfDayISO(ymd: string): string {
  // São Paulo é UTC-3 (sem horário de verão); meia-noite local = 03:00 UTC.
  return new Date(`${ymd}T03:00:00.000Z`).toISOString();
}

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
