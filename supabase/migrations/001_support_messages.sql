-- Mensagens de suporte enviadas pelos usuários (formulário da página /suporte).
-- O endereço de e-mail do time NÃO fica no site: as mensagens são lidas
-- diretamente pelo painel do Supabase (Table Editor > support_messages).
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text,
  email text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Qualquer pessoa (logada ou não) pode ENVIAR uma mensagem...
drop policy if exists "support_insert" on public.support_messages;
create policy "support_insert" on public.support_messages
  for insert to anon, authenticated with check (true);

-- ...mas ninguém consegue LER pelo site (só o service role / painel do Supabase).
grant insert on public.support_messages to anon, authenticated;
