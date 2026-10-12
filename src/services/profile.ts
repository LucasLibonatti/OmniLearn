import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { ProfileRow } from '../types/database';

function toProfile(r: ProfileRow): Profile {
  const xp = r.xp ?? 0;
  return {
    id: r.id,
    name: r.name ?? 'Estudante',
    xp,
    streak: r.streak ?? 0,
    level: Math.floor(xp / 1000) + 1,
    last_study_date: r.last_study_date,
    avatar_url: r.avatar_url,
    daily_goal: r.daily_goal ?? 18,
  };
}

const PROFILE_COLS = 'id,name,xp,streak,last_study_date,avatar_url,daily_goal,created_at';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data as ProfileRow) : null;
}

/** Garante que exista a linha em profiles (o gatilho normalmente já cria; isto é a rede de segurança). */
export async function ensureProfile(userId: string, fallbackName: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, name: fallbackName })
    .select(PROFILE_COLS)
    .single();
  if (error) {
    const retry = await getProfile(userId);
    if (retry) return retry;
    throw error;
  }
  return toProfile(data as ProfileRow);
}

export async function updateProfileName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
  if (error) throw error;
}

export async function updateDailyGoal(userId: string, goal: number): Promise<void> {
  const safe = Math.max(5, Math.min(100, Math.round(goal)));
  const { error } = await supabase.from('profiles').update({ daily_goal: safe }).eq('id', userId);
  if (error) throw error;
}

/** Envia a foto para o bucket 'avatars' e guarda a URL pública no perfil. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${userId}/avatar.${ext}`;
  const up = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (up.error) throw up.error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (error) throw error;
  return url;
}
