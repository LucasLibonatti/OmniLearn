import { useAuth } from '../auth';
import { ensureProfile } from '../services/profile';
import { listSubjects } from '../services/subjects';
import type { Profile, SubjectWithStats } from '../types';
import { useAsync } from './useAsync';

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const fallback =
    (session?.user.user_metadata?.name as string | undefined) ??
    session?.user.email?.split('@')[0] ??
    'Estudante';
  return useAsync<Profile | null>(() => (userId ? ensureProfile(userId, fallback) : Promise.resolve(null)), [userId]);
}

export function useSubjects() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useAsync<SubjectWithStats[]>(() => (userId ? listSubjects(userId) : Promise.resolve([])), [userId]);
}
