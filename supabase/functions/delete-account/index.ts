// Edge Function: exclui a conta do usuário e TODOS os seus dados (LGPD).
// Usa a service role para apagar arquivos do Storage e o usuário do Auth
// (as linhas do banco caem por ON DELETE CASCADE).
//
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    return json({ error: 'Configuração do servidor incompleta.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Faça login para excluir a conta.' }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // 1) apaga os arquivos do Storage do usuário
    const { data: mats } = await admin.from('materials').select('storage_path').eq('user_id', user.id);
    const paths = ((mats ?? []) as { storage_path: string }[]).map((m) => m.storage_path).filter(Boolean);
    if (paths.length) await admin.storage.from('materials').remove(paths);

    // 2) apaga o usuário do Auth (o banco cai por cascata)
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ ok: true });
  } catch {
    return json({ error: 'Não foi possível excluir sua conta agora. Tente novamente.' }, 500);
  }
});
