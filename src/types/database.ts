// Tipos das linhas do banco (Supabase/PostgreSQL). Ver supabase/migrations/002_fase1.sql.
export interface ProfileRow {
  id: string;
  name: string | null;
  xp: number | null;
  streak: number | null;
  last_study_date: string | null;
  avatar_url: string | null;
  daily_goal: number | null;
  created_at: string | null;
}

export interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  topic: string | null;
  tone: string | null;
  archived: boolean | null;
  created_at: string | null;
}

export interface MaterialRow {
  id: string;
  user_id: string;
  subject_id: string;
  file_name: string;
  storage_path: string;
  pages: number | null;
  status: string;
  extracted_text: string | null;
  char_count: number | null;
  error_message: string | null;
  created_at: string | null;
}

export interface QuestionRow {
  id: string;
  user_id: string;
  subject_id: string;
  material_id: string | null;
  type: string;
  topic: string;
  prompt: string;
  options: unknown;
  answer: string | null;
  accept: unknown;
  pairs: unknown;
  explanation: string | null;
  difficulty: number | null;
  created_at: string | null;
}

export interface SessionDbRow {
  id: string;
  user_id: string;
  subject_id: string | null;
  mode: string;
  topic_filter: string | null;
  planned_questions: number;
  minutes: number;
  started_at: string;
  finished_at: string | null;
  correct: number;
  total: number;
  xp_gained: number;
}

export interface AnswerRow {
  id: string;
  user_id: string;
  question_id: string;
  session_id: string | null;
  correct: boolean;
  xp_gained: number | null;
  streak_bonus: boolean | null;
  attempt_text: string | null;
  time_ms: number | null;
  answered_at: string;
}

export interface QuestionProgressRow {
  user_id: string;
  question_id: string;
  box: number;
  times_correct: number;
  times_wrong: number;
  last_answered_at: string | null;
  next_review_at: string | null;
}

export interface AchievementRow {
  id: string;
  icon: string;
  title: string;
  descr: string;
}

export interface UserAchievementRow {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
