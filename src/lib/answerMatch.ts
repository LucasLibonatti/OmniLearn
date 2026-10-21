/**
 * answerMatch.ts — Tolerância inteligente a erros de digitação para questões `short`.
 * Substitui a verificação antiga `norm(v).includes(a)` por normalização robusta,
 * singularização básica e distância de Levenshtein proporcional ao tamanho do alvo.
 */

const STOPWORDS_RE = /^(o|a|os|as|um|uma|uns|umas|de|do|da|dos|das|no|na|nos|nas|the|an)\s+/i;

/** Normaliza texto: minúsculas, sem acentos, sem pontuação, espaços colapsados. */
export function normText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove artigos/preposições iniciais comuns em PT e EN. */
function stripLeadingStopwords(s: string): string {
  let out = s;
  // Remove até 3 stopwords consecutivas no início
  for (let i = 0; i < 3; i++) {
    const next = out.replace(STOPWORDS_RE, '');
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Singularização simples para português e inglês. */
function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ões')) return word.slice(0, -3) + 'ão';
  if (word.endsWith('ães')) return word.slice(0, -3) + 'ão';
  if (word.endsWith('ais')) return word.slice(0, -3) + 'al';
  if (word.endsWith('éis')) return word.slice(0, -3) + 'el';
  if (word.endsWith('ois')) return word.slice(0, -3) + 'ol';
  if (word.endsWith('ns') && word.length > 4) return word.slice(0, -2) + 'm';
  if (word.endsWith('es') && !word.endsWith('ses') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 4) return word.slice(0, -1);
  return word;
}

/** Singulariza cada palavra de uma frase. */
function singularizePhrase(s: string): string {
  return s.split(' ').map(singularize).join(' ');
}

/** Distância de edição de Levenshtein entre duas strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** Similaridade proporcional (0..1) baseada em Levenshtein. */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Retorna a tolerância máxima de Levenshtein com base no tamanho do alvo. */
function maxDistanceFor(targetLen: number): number {
  if (targetLen <= 4) return 0;
  if (targetLen <= 8) return 1;
  if (targetLen <= 14) return 2;
  return 3;
}

/**
 * Verifica se a resposta digitada pelo usuário está correta para uma questão `short`,
 * usando normalização, remoção de stopwords, singularização e Levenshtein proporcional.
 */
export function isShortAnswerCorrect(
  userInput: string,
  canonicalAnswer: string,
  acceptList?: string[] | null,
): boolean {
  const raw = normText(userInput);
  if (!raw) return false;

  const cleaned = stripLeadingStopwords(raw);
  const singularized = singularizePhrase(cleaned);

  // Monta conjunto de alvos válidos
  const targets = [canonicalAnswer, ...(acceptList ?? [])]
    .map((t) => normText(t))
    .filter(Boolean);

  if (targets.length === 0) return false;

  // Prepara versões limpas dos alvos
  const processedTargets = targets.map((t) => ({
    original: t,
    cleaned: stripLeadingStopwords(t),
    singularized: singularizePhrase(stripLeadingStopwords(t)),
  }));

  // 1. Match exato (normalizado ou singularizado)
  for (const pt of processedTargets) {
    if (cleaned === pt.cleaned || singularized === pt.singularized) {
      return true;
    }
  }

  // 2. Levenshtein proporcional contra cada alvo
  for (const pt of processedTargets) {
    const targetForDist = pt.cleaned;
    const dist = levenshtein(cleaned, targetForDist);
    const maxDist = maxDistanceFor(targetForDist.length);

    if (dist <= maxDist) return true;

    // Para alvos longos, também aceita similaridade >= 0.82
    if (targetForDist.length >= 15 && similarity(cleaned, targetForDist) >= 0.82) {
      return true;
    }

    // Também testa versão singularizada
    const distSing = levenshtein(singularized, pt.singularized);
    if (distSing <= maxDist) return true;
  }

  // 3. Sub-trecho: se o usuário escreveu uma frase curta (até 6 palavras),
  // verifica se algum sub-trecho consecutivo bate com um alvo (>= 4 chars).
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length >= 2 && words.length <= 6) {
    for (const pt of processedTargets) {
      const targetWords = pt.cleaned.split(' ').filter(Boolean);
      const targetLen = targetWords.length;
      if (targetLen < 1 || pt.cleaned.length < 4) continue;

      // Desliza janela de tamanho targetLen sobre as palavras do usuário
      for (let i = 0; i <= words.length - targetLen; i++) {
        const sub = words.slice(i, i + targetLen).join(' ');
        const dist = levenshtein(sub, pt.cleaned);
        const maxDist = maxDistanceFor(pt.cleaned.length);
        if (dist <= maxDist) return true;
      }

      // Também tenta match parcial: alvo é substring das palavras do usuário
      if (pt.cleaned.length >= 4) {
        for (let len = targetLen; len <= words.length; len++) {
          for (let i = 0; i <= words.length - len; i++) {
            const sub = words.slice(i, i + len).join(' ');
            if (sub.includes(pt.cleaned)) return true;
            const d = levenshtein(sub, pt.cleaned);
            if (d <= maxDistanceFor(pt.cleaned.length)) return true;
          }
        }
      }
    }
  }

  return false;
}
