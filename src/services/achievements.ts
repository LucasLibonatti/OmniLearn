import { supabase } from '../lib/supabase';
import type { Achievement } from '../types';
import type { AchievementRow } from '../types/database';

export async function listAchievements(userId: string): Promise<Achievement[]> {
  const [{ data: cat, error: e1 }, { data: mine, error: e2 }] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id,unlocked_at').eq('user_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const unlockedMap = new Map(
    ((mine ?? []) as { achievement_id: string; unlocked_at: string }[]).map((m) => [m.achievement_id, m.unlocked_at]),
  );
  const order = ['first_session', 'perfect_week', 'hundred_questions', 'subject_master', 'consistent_30'];
  return ((cat ?? []) as AchievementRow[])
    .map((a) => ({ ...a, unlocked: unlockedMap.has(a.id), unlocked_at: unlockedMap.get(a.id) ?? null }))
    .sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
}

export async function newlyUnlocked(userId: string, sinceISO: string): Promise<Achievement[]> {
  const all = await listAchievements(userId);
  return all.filter((a) => a.unlocked && a.unlocked_at && a.unlocked_at >= sinceISO);
}

export async function userHasAchievement(userId: string, id: string): Promise<boolean> {
  const { count } = await supabase
    .from('user_achievements')
    .select('achievement_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('achievement_id', id);
  return (count ?? 0) > 0;
}
