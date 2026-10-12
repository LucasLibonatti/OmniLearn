/*
  002_fase1.sql — OmniLearn
  Rodar no SQL Editor do Supabase (Dashboard → SQL). Pode rodar mais de uma vez (quase tudo é idempotente).
*/

-- 1) subjects: tom de cor da matéria + arquivamento
alter table public.subjects add column if not exists tone text;
alter table public.subjects add column if not exists archived boolean not null default false;

-- 2) materials: texto extraído, contagem e mensagem de erro; novos status
alter table public.materials add column if not exists extracted_text text;
alter table public.materials add column if not exists char_count int;
alter table public.materials add column if not exists error_message text;
update public.materials set status = 'ready' where status = 'processing';
alter table public.materials drop constraint if exists materials_status_check;
alter table public.materials add constraint materials_status_check check (status in ('uploaded','extracted','generating','ready','error'));

-- 3) questions: dificuldade 1-3
alter table public.questions add column if not exists difficulty smallint not null default 2 check (difficulty between 1 and 3);

-- 4) sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  mode text not null default 'smart' check (mode in ('smart','review','topic')),
  topic_filter text,
  planned_questions int not null default 18,
  minutes int not null default 15,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  correct int not null default 0,
  total int not null default 0,
  xp_gained int not null default 0
);
alter table public.sessions enable row level security;
drop policy if exists "sessions_select" on public.sessions;
create policy "sessions_select" on public.sessions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert" on public.sessions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_update" on public.sessions for update to authenticated using (auth.uid() = user_id);

-- 5) answers: vínculo com a sessão + o que o aluno escreveu
alter table public.answers add column if not exists session_id uuid references public.sessions(id) on delete set null;
alter table public.answers add column if not exists attempt_text text;
alter table public.answers add column if not exists time_ms int;
alter table public.answers add column if not exists streak_bonus boolean not null default false;

-- 6) question_progress (revisão espaçada, caixas de Leitner)
create table if not exists public.question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_answered_at timestamptz,
  next_review_at timestamptz,
  primary key (user_id, question_id)
);
alter table public.question_progress enable row level security;
drop policy if exists "qp_select" on public.question_progress;
create policy "qp_select" on public.question_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "qp_update" on public.question_progress;
create policy "qp_update" on public.question_progress for update to authenticated using (auth.uid() = user_id);

-- 7) conquistas (catálogo + conquistas do usuário)
create table if not exists public.achievements (
  id text primary key,
  icon text not null,
  title text not null,
  descr text not null
);
alter table public.achievements enable row level security;
drop policy if exists "achievements_select" on public.achievements;
create policy "achievements_select" on public.achievements for select to authenticated using (true);
insert into public.achievements (id, icon, title, descr) values
  ('first_session','🏆','Primeira sessão','Complete sua primeira sessão de estudos.'),
  ('perfect_week','🔥','Semana perfeita','Estude 7 dias seguidos.'),
  ('hundred_questions','📚','100 questões','Responda 100 questões no total.'),
  ('subject_master','🧠','Mestre da matéria','Alcance 90% de acerto em alguma matéria com ao menos 20 respostas.'),
  ('consistent_30','⚡','Consistente','Estude 30 dias seguidos.'),
  ('perfect_session','✨','Sessão perfeita','Acerte 100% de uma sessão com ao menos 10 questões.'),
  ('ten_sessions','🚀','Maratonista','Complete 10 sessões de estudos.'),
  ('subject_master_x3','👑','Polímata','Alcance 90% de acerto em 3 matérias diferentes com ao menos 20 respostas cada.')
on conflict (id) do nothing;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
drop policy if exists "ua_select" on public.user_achievements;
create policy "ua_select" on public.user_achievements for select to authenticated using (auth.uid() = user_id);

-- 8) generation_log (limite de uso da IA; escrita só pela Edge Function com service role)
create table if not exists public.generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  material_id uuid references public.materials(id) on delete set null,
  created_at timestamptz not null default now(),
  status text
);
alter table public.generation_log enable row level security;
drop policy if exists "gl_select" on public.generation_log;
create policy "gl_select" on public.generation_log for select to authenticated using (auth.uid() = user_id);

-- 9) índices
create index if not exists answers_user_time_idx on public.answers(user_id, answered_at);
create index if not exists answers_session_idx on public.answers(session_id);
create index if not exists questions_subject_topic_idx on public.questions(subject_id, topic);
create index if not exists question_progress_user_review_idx on public.question_progress(user_id, next_review_at);

-- 10) RPCs do motor de sessão
-- Extra de segurança: permitir o próprio usuário atualizar o nome no perfil
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- start_session: cria a sessão e devolve o id
create or replace function public.start_session(
  p_subject_id uuid,
  p_mode text default 'smart',
  p_topic_filter text default null,
  p_planned int default 18
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  insert into public.sessions (user_id, subject_id, mode, topic_filter, planned_questions)
  values (v_user, p_subject_id, p_mode, p_topic_filter, p_planned)
  returning id into v_id;
  return v_id;
end $$;

-- record_answer: grava a resposta, calcula XP e bônus de sequência, atualiza Leitner e os contadores da sessão
create or replace function public.record_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_correct boolean,
  p_attempt_text text default null,
  p_time_ms int default null
) returns table (xp_gained int, streak_bonus boolean, session_correct int, session_total int, session_xp int)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_streak int := 0;
  v_xp int;
  v_bonus boolean := false;
  v_prow record;
  v_rec record;
  v_box int;
  v_next timestamptz;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select user_id into v_owner from public.sessions where id = p_session_id;
  if v_owner is null or v_owner <> v_user then raise exception 'session not found'; end if;

  -- acertos consecutivos já feitos nesta sessão (do mais recente para trás, para no primeiro erro)
  for v_rec in
    select correct from public.answers a
    where a.session_id = p_session_id and a.user_id = v_user
    order by a.answered_at desc, a.id desc
  loop
    exit when not v_rec.correct;
    v_streak := v_streak + 1;
  end loop;

  v_xp := case when p_correct then 10 else 3 end;
  if p_correct and v_streak >= 2 then
    v_xp := v_xp + 5;
    v_bonus := true;
  end if;

  insert into public.answers (user_id, question_id, session_id, correct, xp_gained, streak_bonus, attempt_text, time_ms)
  values (v_user, p_question_id, p_session_id, p_correct, v_xp, v_bonus, p_attempt_text, p_time_ms);

  -- revisão espaçada (Leitner 1-5)
  select * into v_prow from public.question_progress where user_id = v_user and question_id = p_question_id;
  if v_prow is null then
    insert into public.question_progress (user_id, question_id, box, times_correct, times_wrong, last_answered_at, next_review_at)
    values (v_user, p_question_id, 1,
            case when p_correct then 1 else 0 end,
            case when p_correct then 0 else 1 end,
            now(), now() + interval '1 day');
  else
    v_box := case when p_correct then least(v_prow.box + 1, 5) else 1 end;
    v_next := now() + case v_box when 1 then interval '1 day' when 2 then interval '3 days'
                              when 3 then interval '7 days' when 4 then interval '14 days'
                              else interval '30 days' end;
    update public.question_progress set
      box = v_box,
      times_correct = times_correct + case when p_correct then 1 else 0 end,
      times_wrong = times_wrong + case when p_correct then 0 else 1 end,
      last_answered_at = now(),
      next_review_at = v_next
      where user_id = v_user and question_id = p_question_id;
  end if;

  update public.sessions set
    correct = correct + case when p_correct then 1 else 0 end,
    total = total + 1,
    xp_gained = xp_gained + v_xp
  where id = p_session_id;

  return query select v_xp, v_bonus,
    (select s.correct from public.sessions s where s.id = p_session_id),
    (select s.total from public.sessions s where s.id = p_session_id),
    (select s.xp_gained from public.sessions s where s.id = p_session_id);
end $$;

-- complete_session: fecha a sessão, soma XP, atualiza sequência e avalia conquistas
create or replace function public.complete_session(p_session_id uuid)
returns table (session_correct int, session_total int, session_xp int, new_xp int, streak int, level int, new_achievements jsonb)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_correct int; v_total int; v_sxp int;
  v_streak int; v_last date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := v_today - 1;
  v_profile_xp int;
  v_level int;
  v_new_ach jsonb := '[]'::jsonb;
  v_hit boolean;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select s.user_id, s.correct, s.total, s.xp_gained into v_user, v_correct, v_total, v_sxp
  from public.sessions s where s.id = p_session_id;
  if v_user is null then raise exception 'session not found'; end if;

  update public.sessions set finished_at = now() where id = p_session_id;

  -- sequência em fuso America/Sao_Paulo
  select streak, last_study_date into v_streak, v_last from public.profiles where id = v_user;
  if v_last is null or v_last < v_yesterday then v_streak := 1;
  elsif v_last = v_yesterday then v_streak := v_streak + 1;
  end if;
  update public.profiles set
    streak = v_streak,
    last_study_date = v_today,
    xp = xp + v_sxp
  where id = v_user;

  select xp into v_profile_xp from public.profiles where id = v_user;
  v_level := floor(v_profile_xp / 1000.0)::int + 1;

  -- conquistas (avaliadas e concedidas aqui)
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'first_session')
     and (select count(*) from public.sessions where user_id = v_user and finished_at is not null) >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'first_session');
    v_new_ach := v_new_ach || jsonb_build_object('id','first_session','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'perfect_week')
     and v_streak >= 7 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'perfect_week');
    v_new_ach := v_new_ach || jsonb_build_object('id','perfect_week','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'hundred_questions')
     and (select count(*) from public.answers where user_id = v_user) >= 100 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'hundred_questions');
    v_new_ach := v_new_ach || jsonb_build_object('id','hundred_questions','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'consistent_30')
     and v_streak >= 30 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'consistent_30');
    v_new_ach := v_new_ach || jsonb_build_object('id','consistent_30','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'perfect_session')
     and v_total >= 10 and v_correct = v_total then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'perfect_session');
    v_new_ach := v_new_ach || jsonb_build_object('id','perfect_session','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'ten_sessions')
     and (select count(*) from public.sessions where user_id = v_user and finished_at is not null) >= 10 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'ten_sessions');
    v_new_ach := v_new_ach || jsonb_build_object('id','ten_sessions','unlocked_at', now());
  end if;

  -- mestre da matéria (e polímata): matérias com >= 20 respostas e acerto >= 90%
  select count(*) into v_level from (
    select su.id from public.subjects su
    join public.questions qu on qu.subject_id = su.id
    join public.answers an on an.question_id = qu.id and an.user_id = v_user
    where su.archived = false
    group by su.id
    having count(*) >= 20 and (avg((an.correct)::int) >= 0.9)
  ) as m;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'subject_master')
     and v_level >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'subject_master');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'subject_master_x3')
     and v_level >= 3 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'subject_master_x3');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master_x3','unlocked_at', now());
  end if;

  return query select v_correct, v_total, v_sxp, v_profile_xp, v_streak, v_level, v_new_ach;
end $$;

-- 11) Storage: bucket privado 'materials' com políticas por usuário (primeiro segmento do caminho = user_id)
insert into storage.buckets (id, name, public) values ('materials','materials',false) on conflict (id) do nothing;
drop policy if exists "materials_select_own" on storage.objects;
create policy "materials_select_own" on storage.objects for select to authenticated
  using ((bucket_id = 'materials') and ((storage.foldername(name))[1] = (auth.uid())::text));
drop policy if exists "materials_insert_own" on storage.objects;
create policy "materials_insert_own" on storage.objects for insert to authenticated
  with check ((bucket_id = 'materials') and ((storage.foldername(name))[1] = (auth.uid())::text));
drop policy if exists "materials_update_own" on storage.objects;
create policy "materials_update_own" on storage.objects for update to authenticated
  using ((bucket_id = 'materials') and ((storage.foldername(name))[1] = (auth.uid())::text))
  with check ((bucket_id = 'materials') and ((storage.foldername(name))[1] = (auth.uid())::text));
drop policy if exists "materials_delete_own" on storage.objects;
create policy "materials_delete_own" on storage.objects for delete to authenticated
  using ((bucket_id = 'materials') and ((storage.foldername(name))[1] = (auth.uid())::text));