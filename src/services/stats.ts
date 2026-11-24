import { api } from '../lib/api';
import { weekLabel } from '../lib/dates';
import { tr } from '../i18n';
import type { StatusTone, WeakSpot } from '../types';

export interface DayStat {
  date: string;
  label: string;
  pct: number;
  count: number;
}

export interface SubjectPerf {
  subject_id: string;
  correct: number;
  total: number;
  pct: number;
}

export interface TopicPerf {
  topic: string;
  correct: number;
  total: number;
  pct: number;
}

export interface StatsOverview {
  answered: number;
  accuracy: number;
  weeklyAccuracy: DayStat[];
  mastery: number | null;
  subjectPerformance: SubjectPerf[];
}

export function levelOf(acc: number): { level: string; tone: StatusTone } {
  if (acc < 0.5) return { level: tr('Precisa revisar'), tone: 'rose' };
  if (acc < 0.7) return { level: tr('Em desenvolvimento'), tone: 'amber' };
  if (acc < 0.85) return { level: tr('Quase lá'), tone: 'yellow' };
  return { level: tr('Dominando'), tone: 'emerald' };
}

export async function answeredToday(): Promise<number> {
  const res = await api<{ count: number }>('/api/study/stats/today');
  return res.count;
}

export async function studiedDates(days = 30): Promise<string[]> {
  return api<string[]>(`/api/study/stats/studied-dates?days=${days}`);
}

export async function weakSpots(): Promise<WeakSpot[]> {
  const rows = await api<Array<{ topic: string; subject_id: string; wrong: number; of: number; accuracy: number }>>(
    '/api/study/stats/weak-spots',
  );
  return rows.map((r) => ({
    topic: r.topic,
    subject_id: r.subject_id,
    wrong: r.wrong,
    of: r.of,
    ...levelOf(r.accuracy),
  }));
}

export async function statsOverview(): Promise<StatsOverview> {
  const raw = await api<{
    answered: number;
    accuracy: number;
    weeklyAccuracy: Array<{ date: string; pct: number; count: number }>;
    mastery: number | null;
    subjectPerformance: SubjectPerf[];
  }>('/api/study/stats/overview');

  return {
    ...raw,
    weeklyAccuracy: raw.weeklyAccuracy.map((d) => ({ ...d, label: weekLabel(d.date) })),
  };
}
