import { supabase } from '../lib/supabase';
import { tr } from '../i18n';

export interface SupportInput {
  name?: string;
  email?: string;
  subject?: string;
  message: string;
}

/**
 * Envia uma mensagem de suporte. Ela é gravada na tabela `support_messages`
 * (o e-mail de contato do OmniLearn nunca aparece no site; o time lê as
 * mensagens pelo painel do Supabase).
 */
export async function sendSupport(input: SupportInput): Promise<void> {
  const message = input.message.trim();
  if (message.length < 5) throw new Error(tr('Escreva um pouco mais sobre o que você precisa.'));

  const { error } = await supabase.from('support_messages').insert({
    name: input.name?.trim() || null,
    email: input.email?.trim() || null,
    subject: input.subject?.trim() || null,
    message,
  });
  if (error) throw new Error(tr('Não foi possível enviar sua mensagem. Tente novamente mais tarde.'));
}
