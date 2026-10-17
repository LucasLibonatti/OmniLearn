import { supabase } from '../lib/supabase';
import { tr } from '../i18n';

export interface GenerationResult {
  inserted: number;
}

/** Chama a Edge Function que fala com a IA. A chave nunca fica no navegador. */
export async function generateQuestions(subjectId: string): Promise<GenerationResult> {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: { subject_id: subjectId },
  });

  if (error) {
    let message = tr('Não foi possível gerar as questões agora. Tente novamente em instantes.');
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch {
        /* mantém a mensagem padrão */
      }
      if (ctx.status === 404) message = tr('A função de geração ainda não foi publicada no Supabase.');
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return { inserted: (data?.inserted as number) ?? 0 };
}
