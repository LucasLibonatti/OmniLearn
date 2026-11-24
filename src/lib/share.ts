/** Compartilha um texto usando o menu nativo do aparelho ou copia para a área de transferência. */
export async function shareText(text: string, title = 'OmniLearn'): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
