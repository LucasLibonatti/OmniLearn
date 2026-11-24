import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

export function useProfile() {
  return useAppData().profile;
}

export function useSubjects() {
  return useAppData().subjects;
}

export function useArchivedSubjects() {
  const { archivedSubjects } = useAppData();
  const { data, loading, reload } = archivedSubjects;

  useEffect(() => {
    if (data === null && !loading) {
      void reload();
    }
  }, [data, loading, reload]);

  return archivedSubjects;
}
