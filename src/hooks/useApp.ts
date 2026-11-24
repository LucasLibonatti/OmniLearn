import { useAuth } from '../auth';
import { getProfile } from '../services/profile';
import { listArchivedSubjects, listSubjects } from '../services/subjects';
import type { Profile, SubjectWithStats } from '../types';
import { useAsync } from './useAsync';

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useAsync<Profile | null>(() => (userId ? getProfile() : Promise.resolve(null)), [userId]);
}

export function useSubjects() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useAsync<SubjectWithStats[]>(() => (userId ? listSubjects() : Promise.resolve([])), [userId]);
}

export function useArchivedSubjects() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useAsync<SubjectWithStats[]>(() => (userId ? listArchivedSubjects() : Promise.resolve([])), [userId]);
}
