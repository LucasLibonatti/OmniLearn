// Edge Function: gera questões a partir do texto extraído usando a API da Groq (Llama 3).
// Secrets necessários: GROQ_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const MAX_CHARS = 60000;
const DEFAULT_QUANTITY = 30;
const MAX_QUANTITY = 40;

type QType = 'multiple' | 'tf' | 'fill' | 'match' | 'short';

interface RawQuestion {
  type?: string;
  topic?: string;
  prompt?: string;
  options?: unknown;
  answer?: unknown;
  accept?: unknown;
  pairs?: unknown;
  explanation?: string;
  difficulty?: unknown;
}

interface CleanQuestion {
  type: QType;
  topic: string;
  prompt: string;
  options: string[] | null;
  answer: string;
  accept: string[] | null;
  pairs: [string, string][] | null;
  explanation: string;
  difficulty: number;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
}

function clean(q: RawQuestion): CleanQuestion | null {
  const type = q.type as QType;
  if (!['multiple', 'tf', 'fill', 'match', 'short'].includes(type)) return null;
  const prompt = (q.prompt ?? '').trim();
  const topic = (q.topic ?? '').trim().slice(0, 60);
  const explanation = (q.explanation ?? '').trim();
  if (prompt.length < 5 || !topic || explanation.length < 3) return null;
  const difficulty = Math.min(3, Math.max(1, Math.round(Number(q.difficulty) || 2)));

  if (type === 'multiple') {
    const options = asStringArray(q.options);
    const answer = typeof q.answer === 'string' ? q.answer.trim() : '';
    if (options.length !== 4 || !options.includes(answer)) return null;
    return { type, topic, prompt, options, answer, accept: null, pairs: null, explanation, difficulty };
  }

  if (type === 'tf') {
    const options = ['Verdadeiro', 'Falso'];
    const answer = typeof q.answer === 'string' ? q.answer.trim() : '';
    if (!options.includes(answer)) return null;
    return { type, topic, prompt, options, answer, accept: null, pairs: null, explanation, difficulty };
  }

  if (type === 'fill') {
    if (!prompt.includes('____')) return null;
    const options = asStringArray(q.options);
    const answer = typeof q.answer === 'string' ? q.answer.trim() : '';
    if (options.length !== 4 || !options.includes(answer)) return null;
    return { type, topic, prompt, options, answer, accept: null, pairs: null, explanation, difficulty };
  }

  if (type === 'match') {
    const pairs = Array.isArray(q.pairs)
      ? (q.pairs as unknown[])
          .map((p) => (Array.isArray(p) ? p : null))
          .filter((p): p is unknown[] => !!p && typeof p[0] === 'string' && typeof p[1] === 'string')
          .map((p) => [String(p[0]).trim(), String(p[1]).trim()] as [string, string])
          .filter((p) => p[0] && p[1])
      : [];
    if (pairs.length < 3 || pairs.length > 4) return null;
    const answer = pairs.map((p) => p.join(' = ')).join(' ; ');
    return { type, topic, prompt, options: null, answer, accept: null, pairs, explanation, difficulty };
  }

  const answer = typeof q.answer === 'string' ? q.answer.trim() : '';
  const acceptRaw = asStringArray(q.accept).map(norm).filter(Boolean);
  if (!answer || acceptRaw.length === 0) return null;
  const accept = [...new Set([norm(answer), ...acceptRaw])];
  return { type, topic, prompt, options: null, answer, accept, pairs: null, explanation, difficulty };
}

function balancedTruncate(texts: string[]): string {
  const nonEmpty = texts.filter((t) => t.trim().length > 0);
  if (!nonEmpty.length) return '';
  const total = nonEmpty.reduce((a, t) => a + t.length, 0);
  if (total <= MAX_CHARS) return nonEmpty.join('\n\n---\n\n');
  const per = Math.floor(MAX_CHARS / nonEmpty.length);
  let remaining = MAX_CHARS;
  const parts: string[] = [];
  for (const t of nonEmpty) {
    const take = Math.min(t.length, Math.max(per, 0), remaining);
    parts.push(t.slice(0, take));
    remaining -= take;
  }
  return parts.join('\n\n---\n\n');
}

function buildPrompt(subjectName: string, subjectTopic: string, content: string, quantity: number): string {
  return [
    'Você é um professor brasileiro que cria exercícios de revisão a partir do material de estudo de um aluno.',
    'Responda EXCLUSIVAMENTE em formato JSON puro, seguindo este formato estruturado:',
    '{"questions": [{"type": "multiple", "topic": "Assunto", "prompt": "Enunciado", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "Explicação", "difficulty": 2}]}',
    '',
    `Matéria: ${subjectName}${subjectTopic ? ` — ${subjectTopic}` : ''}.`,
    `Gere ${quantity} questões em português do Brasil, baseadas EXCLUSIVAMENTE no material abaixo.`,
    '',
    'Regras obrigatórias:',
    '- Não invente fatos que não estejam no material.',
    '- Use de 3 a 8 assuntos curtos e reutilizáveis no campo "topic".',
    '- Misture os tipos: multiple, tf, fill, match, short.',
    '- Cada questão deve ter "explanation" e "difficulty" (1 a 3).',
    '',
    '--- MATERIAL ---',
    content,
    '--- FIM DO MATERIAL ---',
  ].join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  const LIMIT = Number(Deno.env.get('DAILY_GENERATION_LIMIT') || '5');
  const UNLIMITED = new Set(
    (Deno.env.get('UNLIMITED_USERS') || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    return json({ error: 'Configuração do servidor incompleta.' }, 500);
  }
  if (!GROQ_API_KEY) {
    return json({ error: 'A chave da Groq não foi configurada (secret GROQ_API_KEY).' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Faça login para gerar questões.' }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401);

  let body: { subject_id?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }
  const subjectId = body.subject_id;
  const quantity = Math.min(MAX_QUANTITY, Math.max(5, Math.round(Number(body.quantity) || DEFAULT_QUANTITY)));
  if (!subjectId) return json({ error: 'Informe a matéria.' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: subject } = await admin
    .from('subjects')
    .select('id,name,topic')
    .eq('id', subjectId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!subject) return json({ error: 'Matéria não encontrada.' }, 404);

  const nowSP = new Date();
  const startOfDay = new Date(nowSP.toISOString().slice(0, 10) + 'T00:00:00-03:00').toISOString();
  const { count: usedToday } = await admin
    .from('generation_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfDay);
  const isUnlimited = UNLIMITED.has((user.email ?? '').toLowerCase()) || UNLIMITED.has(user.id.toLowerCase());
  if (!isUnlimited && (usedToday ?? 0) >= LIMIT) {
    return json({ error: `Você atingiu o limite de ${LIMIT} gerações por dia. Tente novamente amanhã.` }, 429);
  }

  const { data: materials } = await admin
    .from('materials')
    .select('id,extracted_text')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id);
  const withText = (materials ?? []).filter((m) => m.extracted_text && m.extracted_text.trim().length > 0);
  if (!withText.length) {
    return json({ error: 'Não encontramos texto legível nos materiais desta matéria.' }, 400);
  }

  const { data: logRow } = await admin
    .from('generation_log')
    .insert({ user_id: user.id, material_id: withText[0].id, status: 'generating' })
    .select('id')
    .single();
  const logId = logRow?.id as string | undefined;

  await admin.from('materials').update({ status: 'generating', error_message: null }).eq('subject_id', subjectId).eq('user_id', user.id);

  const content = balancedTruncate(withText.map((m) => m.extracted_text as string));
  const prompt = buildPrompt(subject.name ?? 'Matéria', subject.topic ?? '', content, quantity);

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      },
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      await admin.from('materials').update({ status: 'error', error_message: 'A IA não conseguiu gerar as questões.' }).eq('subject_id', subjectId).eq('user_id', user.id);
      if (logId) await admin.from('generation_log').update({ status: 'error' }).eq('id', logId);
      return json({ error: `Erro na API da Groq (${groqRes.status}): ${errText}` }, 502);
    }

    const groqJson = await groqRes.json();
    const contentText = groqJson?.choices?.[0]?.message?.content;
    if (!contentText) throw new Error('resposta vazia');

    let parsed: { questions?: RawQuestion[] };
    try {
      parsed = JSON.parse(contentText);
    } catch {
      throw new Error('JSON inválido');
    }

    const seen = new Set<string>();
    const cleaned: CleanQuestion[] = [];
    for (const raw of parsed.questions ?? []) {
      const q = clean(raw);
      if (!q) continue;
      const key = norm(q.prompt);
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(q);
    }

    if (!cleaned.length) throw new Error('nenhuma questão válida');

    const rows = cleaned.map((q) => ({
      user_id: user.id,
      subject_id: subjectId,
      material_id: withText.length === 1 ? withText[0].id : null,
      type: q.type,
      topic: q.topic,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      accept: q.accept,
      pairs: q.pairs,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }));

    const { error: insertError } = await admin.from('questions').insert(rows);
    if (insertError) throw insertError;

    await admin.from('materials').update({ status: 'ready', error_message: null }).eq('subject_id', subjectId).eq('user_id', user.id);
    if (logId) await admin.from('generation_log').update({ status: 'success' }).eq('id', logId);

    return json({ inserted: rows.length });
  } catch (err: any) {
    await admin.from('materials').update({ status: 'error', error_message: 'Falha ao gerar as questões.' }).eq('subject_id', subjectId).eq('user_id', user.id);
    if (logId) await admin.from('generation_log').update({ status: 'error' }).eq('id', logId);
    return json({ error: `Erro detalhado: ${err?.message || err}` }, 500);
  }
});
