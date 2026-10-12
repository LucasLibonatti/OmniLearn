import { supabase } from '../lib/supabase';

/** Exclui a conta e todos os dados do usuário via Edge Function (que usa a service role). */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) {
    let message = 'Não foi possível excluir sua conta agora.';
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch {
        /* mantém a mensagem padrão */
      }
      if (ctx.status === 404) message = 'A função de exclusão ainda não foi publicada no Supabase.';
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
}
