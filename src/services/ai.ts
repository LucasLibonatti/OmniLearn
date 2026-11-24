import { api } from '../lib/api';
import { tr } from '../i18n';

async function call(body: Record<string, unknown>, fallback: string): Promise<string> {
  const data = await api<{ text?: string }>('/api/ai/tools', { method: 'POST', body });
  const text = data?.text;
  if (typeof text !== 'string' || !text.trim()) throw new Error(fallback);
  return text.trim();
}

/** Resumo da matéria gerado pela IA a partir dos materiais enviados. */
export function summarizeSubject(subjectId: string): Promise<string> {
  return call({ action: 'summary', subject_id: subjectId }, tr('Não foi possível gerar o resumo agora.'));
}

/** Explicação alternativa de uma questão. */
export function explainQuestion(questionId: string): Promise<string> {
  return call({ action: 'explain', question_id: questionId }, tr('Não foi possível gerar a explicação agora.'));
}
