import { api } from '../lib/api';
import { tr } from '../i18n';

export interface SupportInput {
  name?: string;
  email?: string;
  subject?: string;
  message: string;
}

export async function sendSupport(input: SupportInput): Promise<void> {
  const message = input.message.trim();
  if (message.length < 5) throw new Error(tr('Escreva um pouco mais sobre o que você precisa.'));
  await api('/api/support', {
    method: 'POST',
    body: {
      name: input.name?.trim() || undefined,
      email: input.email?.trim() || undefined,
      subject: input.subject?.trim() || undefined,
      message,
    },
  });
}
