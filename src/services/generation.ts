import { tr } from '../i18n';
import { GENERATION_NOT_PUBLISHED, invokeFunction } from './fn';

export interface GenerationResult {
  inserted: number;
}

/** Chama a Edge Function que fala com a IA. A chave nunca fica no navegador. */
export async function generateQuestions(subjectId: string): Promise<GenerationResult> {
  const data = await invokeFunction<{ inserted?: number }>(
    'generate-questions',
    { subject_id: subjectId },
    tr('Não foi possível gerar as questões agora. Tente novamente em instantes.'),
    GENERATION_NOT_PUBLISHED(),
  );
  return { inserted: data?.inserted ?? 0 };
}
