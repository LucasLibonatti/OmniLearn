import { describe, expect, it } from 'vitest';
import { capExtractedText } from '../lib/extract';

describe('capExtractedText', () => {
  it('mantém textos dentro do limite sem modificação', () => {
    const short = 'Capítulo 1 — Introdução à Biologia Celular.\n\nAs células são unidades fundamentais.';
    expect(capExtractedText(short, 1000)).toBe(short);
  });

  it('amostra trechos do início, meio e fim quando o texto excede o limite seguro', () => {
    const big =
      'INICIO_DO_LIVRO ' +
      'conteudo '.repeat(500) +
      'MEIO_DO_LIVRO ' +
      'conteudo '.repeat(500) +
      'FIM_DO_LIVRO';
    const capped = capExtractedText(big, 1200);
    expect(capped.length).toBeLessThanOrEqual(1200);
    expect(capped).toContain('INICIO_DO_LIVRO');
    expect(capped).toContain('FIM_DO_LIVRO');
  });
});
