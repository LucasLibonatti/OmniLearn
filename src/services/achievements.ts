import { api } from '../lib/api';
import type { Achievement } from '../types';

export async function listAchievements(): Promise<Achievement[]> {
  return api<Achievement[]>('/api/study/achievements');
}

export async function newlyUnlocked(sinceISO: string): Promise<Achievement[]> {
  return api<Achievement[]>(`/api/study/achievements?since=${encodeURIComponent(sinceISO)}`);
}
