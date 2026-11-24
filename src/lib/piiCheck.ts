/**
 * Verificação preventiva leve (client-side) de dados pessoais sensíveis / PII
 * antes de enviar o texto extraído para inferência de IA externa (LGPD Art. 5º, II e Art. 6º, III).
 */

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(digits[10]);
}

function passesLuhn(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export interface PiiWarning {
  kinds: ('cpf' | 'card')[];
}

export function detectSensitivePii(text: string): PiiWarning | null {
  const kinds = new Set<'cpf' | 'card'>();

  // CPF formatado (000.000.000-00) validado por dígito verificador
  const cpfMatches = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) ?? [];
  for (const m of cpfMatches) {
    if (isValidCpf(m.replace(/\D/g, ''))) {
      kinds.add('cpf');
      break;
    }
  }

  // Cartão de crédito (4 blocos de 4 dígitos) validado por Luhn
  const cardMatches = text.match(/\b(?:\d{4}[-\s]){3}\d{4}\b/g) ?? [];
  for (const m of cardMatches) {
    if (passesLuhn(m.replace(/\D/g, ''))) {
      kinds.add('card');
      break;
    }
  }

  return kinds.size ? { kinds: [...kinds] } : null;
}
