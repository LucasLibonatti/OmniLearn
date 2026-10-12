/** Compartilha um texto usando o menu nativo do aparelho e, se não houver, copia para a área de transferência. */
export async function shareText(text: string, title = 'OmniLearn'): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
