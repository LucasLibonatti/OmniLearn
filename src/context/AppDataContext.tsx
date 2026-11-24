import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth';
import { getProfile } from '../services/profile';
import { listArchivedSubjects, listSubjects } from '../services/subjects';
import type { Profile, SubjectWithStats } from '../types';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

interface AppDataValue {
  profile: ResourceState<Profile>;
  subjects: ResourceState<SubjectWithStats[]>;
  archivedSubjects: ResourceState<SubjectWithStats[]>;
  patchProfile: (patch: Partial<Profile>) => void;
  reloadAllSubjects: () => Promise<void>;
}

const AppDataCtx = createContext<AppDataValue>(null!);

export function useAppData() {
  return useContext(AppDataCtx);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [profileState, setProfileState] = useState<{ data: Profile | null; loading: boolean; error: string | null }>({
    data: null,
    loading: false,
    error: null,
  });
  const [subjectsState, setSubjectsState] = useState<{
    data: SubjectWithStats[] | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });
  const [archivedState, setArchivedState] = useState<{
    data: SubjectWithStats[] | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });

  const activeUserRef = useRef<string | null>(null);
  const archivedLoadedRef = useRef(false);

  const loadProfile = useCallback(async (silent = false) => {
    const uid = activeUserRef.current;
    if (!uid) return;
    if (!silent) setProfileState((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const data = await getProfile();
      if (activeUserRef.current === uid) {
        setProfileState({ data, loading: false, error: null });
      }
    } catch (e) {
      if (activeUserRef.current === uid) {
        setProfileState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro inesperado.' }));
      }
    }
  }, []);

  const loadSubjects = useCallback(async (silent = false) => {
    const uid = activeUserRef.current;
    if (!uid) return;
    if (!silent) setSubjectsState((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const data = await listSubjects();
      if (activeUserRef.current === uid) {
        setSubjectsState({ data, loading: false, error: null });
      }
    } catch (e) {
      if (activeUserRef.current === uid) {
        setSubjectsState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro inesperado.' }));
      }
    }
  }, []);

  const loadArchived = useCallback(async (silent = false) => {
    const uid = activeUserRef.current;
    if (!uid) return;
    archivedLoadedRef.current = true;
    if (!silent) setArchivedState((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const data = await listArchivedSubjects();
      if (activeUserRef.current === uid) {
        setArchivedState({ data, loading: false, error: null });
      }
    } catch (e) {
      if (activeUserRef.current === uid) {
        setArchivedState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro inesperado.' }));
      }
    }
  }, []);

  useEffect(() => {
    activeUserRef.current = userId;
    archivedLoadedRef.current = false;
    if (!userId) {
      setProfileState({ data: null, loading: false, error: null });
      setSubjectsState({ data: null, loading: false, error: null });
      setArchivedState({ data: null, loading: false, error: null });
      return;
    }
    setProfileState({ data: null, loading: true, error: null });
    setSubjectsState({ data: null, loading: true, error: null });
    setArchivedState({ data: null, loading: false, error: null });
    void Promise.all([loadProfile(true), loadSubjects(true)]);
  }, [userId, loadProfile, loadSubjects]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState((s) => (s.data ? { ...s, data: { ...s.data, ...patch } } : s));
  }, []);

  const reloadAllSubjects = useCallback(async () => {
    await Promise.all([loadSubjects(true), archivedLoadedRef.current ? loadArchived(true) : Promise.resolve()]);
  }, [loadSubjects, loadArchived]);

  const value = useMemo<AppDataValue>(
    () => ({
      profile: { ...profileState, reload: () => loadProfile(true) },
      subjects: { ...subjectsState, reload: () => loadSubjects(true) },
      archivedSubjects: { ...archivedState, reload: () => loadArchived(false) },
      patchProfile,
      reloadAllSubjects,
    }),
    [profileState, subjectsState, archivedState, loadProfile, loadSubjects, loadArchived, patchProfile, reloadAllSubjects],
  );

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}
