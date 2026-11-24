import { describe, expect, it } from 'vitest';
import { detectSensitivePii } from '../lib/piiCheck';

describe('detectSensitivePii', () => {
  it('não alerta em texto acadêmico comum sem dados sensíveis', () => {
    const sample =
      'A Segunda Guerra Mundial ocorreu entre 1939 e 1945. Em Biologia, o DNA possui 46 cromossomos humanos.';
    expect(detectSensitivePii(sample)).toBeNull();
  });

  it('detecta CPF formatado com dígitos verificadores válidos', () => {
    const res = detectSensitivePii('Documento do aluno: 529.982.247-25 enviado no PDF.');
    expect(res).toEqual({ kinds: ['cpf'] });
  });

  it('ignora sequências com formato de CPF mas dígitos verificadores inválidos ou repetidos', () => {
    expect(detectSensitivePii('Código 111.111.111-11 e referência 123.456.789-00')).toBeNull();
  });

  it('detecta número de cartão de crédito válido pelo algoritmo de Luhn', () => {
    const res = detectSensitivePii('Pagamento registrado no cartão 4532 0151 1283 0366.');
    expect(res).toEqual({ kinds: ['card'] });
  });

  it('ignora sequência de 16 dígitos que falha no algoritmo de Luhn', () => {
    expect(detectSensitivePii('Identificador de série 4532 0151 1283 0367 no catálogo.')).toBeNull();
  });

  it('detecta CPF e cartão simultaneamente quando ambos aparecem no texto', () => {
    const res = detectSensitivePii('CPF 529.982.247-25 e cartão 4532-0151-1283-0366');
    expect(res?.kinds).toContain('cpf');
    expect(res?.kinds).toContain('card');
  });
});
