import { api } from '../lib/api';
import type { Material, Subject, SubjectStats, SubjectWithStats } from '../types';
import type { TopicPerf } from './stats';

export interface SubjectDetail {
  subject: Subject;
  questions: number;
  materials: Material[];
  stats: SubjectStats;
  topics: TopicPerf[];
}

export async function listSubjects(): Promise<SubjectWithStats[]> {
  return api<SubjectWithStats[]>('/api/subjects?archived=false');
}

export async function listArchivedSubjects(): Promise<SubjectWithStats[]> {
  return api<SubjectWithStats[]>('/api/subjects?archived=true');
}

export async function getSubjectDetail(id: string): Promise<SubjectDetail | null> {
  try {
    return await api<SubjectDetail>(`/api/subjects/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function getSubject(id: string): Promise<Subject | null> {
  const detail = await getSubjectDetail(id);
  return detail?.subject ?? null;
}

export async function createSubject(name: string, topic: string | null): Promise<Subject> {
  return api<Subject>('/api/subjects', { method: 'POST', body: { name, topic } });
}

export async function renameSubject(id: string, name: string): Promise<void> {
  await api(`/api/subjects/${encodeURIComponent(id)}`, { method: 'PATCH', body: { name } });
}

export async function archiveSubject(id: string): Promise<void> {
  await api(`/api/subjects/${encodeURIComponent(id)}`, { method: 'PATCH', body: { archived: true } });
}

export async function unarchiveSubject(id: string): Promise<void> {
  await api(`/api/subjects/${encodeURIComponent(id)}`, { method: 'PATCH', body: { archived: false } });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await api(`/api/subjects/${encodeURIComponent(subjectId)}`, { method: 'DELETE' });
}
