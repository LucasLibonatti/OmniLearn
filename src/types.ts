// Tipos do domínio do OmniLearn (usados pelas telas e serviços).
export type QType = 'multiple' | 'tf' | 'fill' | 'match' | 'short';
export type MaterialStatus = 'uploaded' | 'extracted' | 'generating' | 'ready' | 'error';
export type SessionMode = 'smart' | 'review' | 'topic';

export interface Question {
  id: string;
  type: QType;
  topic: string;
  prompt: string;
  options?: string[];
  answer: string;
  accept?: string[];
  pairs?: [string, string][];
  explanation: string;
  difficulty?: number;
  material_id?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  xp: number;
  streak: number;
  level: number;
  last_study_date: string | null;
  avatar_url: string | null;
  daily_goal: number;
}

export interface Subject {
  id: string;
  name: string;
  topic: string | null;
  tone: string | null;
  archived: boolean;
}

export interface Material {
  id: string;
  user_id: string;
  subject_id: string;
  file_name: string;
  storage_path: string;
  pages: number;
  status: MaterialStatus;
  error_message: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  subject_id: string | null;
  mode: SessionMode;
  topic_filter: string | null;
  planned_questions: number;
  minutes: number;
  started_at: string;
  finished_at: string | null;
  correct: number;
  total: number;
  xp_gained: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  descr: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface WeakSpot {
  topic: string;
  subject_id: string;
  wrong: number;
  of: number;
  level: string;
  dot: string;
}

export interface SubjectStats {
  questions: number;
  answered: number;
  accuracy: number;
  progress: number;
  last_session: string | null;
  streak: number;
}

export interface SubjectWithStats extends Subject, SubjectStats {}

export interface SessionResult {
  correct: number;
  total: number;
  xp: number;
  misses: Record<string, number>;
}

export interface CompleteResult {
  session_correct: number;
  session_total: number;
  session_xp: number;
  new_xp: number;
  streak: number;
  level: number;
  new_achievements: { id: string; unlocked_at: string }[];
}
