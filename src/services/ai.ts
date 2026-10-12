import { supabase } from '../lib/supabase';

async function call(body: Record<string, unknown>, fallback: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-tools', { body });
  if (error) throw new Error(fallback);
  if (data?.error) throw new Error(String(data.error));
  const text = data?.text;
  if (typeof text !== 'string' || !text.trim()) throw new Error(fallback);
  return text.trim();
}

/** Resumo da matéria gerado pela IA a partir dos materiais enviados. */
export function summarizeSubject(subjectId: string): Promise<string> {
  return call({ action: 'summary', subject_id: subjectId }, 'Não foi possível gerar o resumo agora.');
}

/** Explicação alternativa de uma questão. */
export function explainQuestion(questionId: string): Promise<string> {
  return call({ action: 'explain', question_id: questionId }, 'Não foi possível gerar a explicação agora.');
}
