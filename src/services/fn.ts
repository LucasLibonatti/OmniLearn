import { supabase } from '../lib/supabase';
import { tr } from '../i18n';

/**
 * Chama uma Edge Function garantindo dois pontos que costumam falhar:
 *  - o cabeçalho `Authorization: Bearer <token>` do usuário logado vai junto;
 *  - a mensagem de erro real do servidor é repassada (em vez de um texto genérico).
 */
export async function invokeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
  fallback: string,
  missingFunctionMessage?: string,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });

  if (error) {
    let message = fallback;
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const payload = await ctx.json();
        if (payload?.error) message = payload.error;
      } catch {
        /* mantém a mensagem padrão */
      }
      if (ctx.status === 404 && missingFunctionMessage) message = missingFunctionMessage;
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

/** Mensagem padrão quando a Edge Function de IA ainda não foi publicada. */
export const AI_NOT_PUBLISHED = () => tr('A função de IA ainda não foi publicada no Supabase.');

/** Mensagem padrão quando a Edge Function de geração ainda não foi publicada. */
export const GENERATION_NOT_PUBLISHED = () => tr('A função de geração ainda não foi publicada no Supabase.');
