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
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,xp,streak,last_study_date,created_at')
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
    .select('id,name,xp,streak,last_study_date,created_at')
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
