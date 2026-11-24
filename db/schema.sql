-- ============================================================================
-- OmniLearn — Schema Completo para Neon PostgreSQL + Better Auth + LGPD
-- ============================================================================
-- Script único e idempotente: cole no SQL Editor do Neon (https://console.neon.tech)
-- e execute uma vez só. Pode ser reexecutado com segurança.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. BETTER AUTH (Autenticação: E-mail/Senha + Google OAuth)
-- ============================================================================

create table if not exists public."user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."session" (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references public."user"(id) on delete cascade
);
create index if not exists session_user_id_idx on public."session"("userId");

create table if not exists public."account" (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references public."user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists account_user_id_idx on public."account"("userId");

create table if not exists public."verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists verification_identifier_idx on public."verification"(identifier);


-- ============================================================================
-- 2. DOMÍNIO OMNILEARN + LGPD
-- ============================================================================

-- profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key references public."user"(id) on delete cascade,
  name text,
  xp int not null default 0,
  streak int not null default 0,
  last_study_date date,
  avatar_url text,
  daily_goal int not null default 18,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- subjects -------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  name text not null,
  topic text,
  tone text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_idx on public.subjects(user_id, archived, created_at desc);

-- materials ------------------------------------------------------------------
-- Minimização LGPD: armazenamos apenas metadados e texto extraído (nunca o binário PDF/PPTX bruto).
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  file_name text not null,
  storage_path text not null default '',
  pages int not null default 0,
  status text not null default 'extracted' check (status in ('uploaded','extracted','generating','ready','error')),
  extracted_text text,
  char_count int,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists materials_subject_idx on public.materials(subject_id, created_at);

-- questions ------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  type text not null check (type in ('multiple','tf','fill','match','short')),
  topic text not null,
  prompt text not null,
  options jsonb,
  answer text,
  accept jsonb,
  pairs jsonb,
  explanation text,
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  created_at timestamptz not null default now()
);
create index if not exists questions_subject_topic_idx on public.questions(subject_id, topic);
create index if not exists questions_user_idx on public.questions(user_id, created_at desc);

-- sessions -------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
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
create index if not exists sessions_user_started_idx on public.sessions(user_id, started_at desc);

-- answers --------------------------------------------------------------------
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  correct boolean not null default false,
  xp_gained int not null default 0,
  streak_bonus boolean not null default false,
  attempt_text text,
  time_ms int,
  answered_at timestamptz not null default now()
);
create index if not exists answers_user_time_idx on public.answers(user_id, answered_at desc);
create index if not exists answers_session_idx on public.answers(session_id);

-- question_progress (Leitner 1-5) --------------------------------------------
create table if not exists public.question_progress (
  user_id text not null references public."user"(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_answered_at timestamptz,
  next_review_at timestamptz,
  primary key (user_id, question_id)
);
create index if not exists question_progress_user_review_idx on public.question_progress(user_id, next_review_at);

-- achievements (catálogo + conquistas do usuário) ----------------------------
create table if not exists public.achievements (
  id text primary key,
  icon text not null,
  title text not null,
  descr text not null
);

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
  user_id text not null references public."user"(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- logs de limite diário da IA ------------------------------------------------
create table if not exists public.generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  created_at timestamptz not null default now(),
  status text
);
create index if not exists generation_log_user_time_idx on public.generation_log(user_id, created_at desc);

create table if not exists public.ai_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  action text,
  created_at timestamptz not null default now()
);
create index if not exists ai_log_user_time_idx on public.ai_log(user_id, created_at desc);

-- mensagens de suporte -------------------------------------------------------
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text references public."user"(id) on delete cascade,
  name text,
  email text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 3. FUNÇÕES PL/pgSQL (Regras de Gamificação, Leitner e Conquistas)
-- ============================================================================

create or replace function public.start_session(
  p_user_id text,
  p_subject_id uuid,
  p_mode text default 'smart',
  p_topic_filter text default null,
  p_planned int default 18
) returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.subjects s where s.id = p_subject_id and s.user_id = p_user_id) then
    raise exception 'subject not found';
  end if;
  insert into public.sessions (user_id, subject_id, mode, topic_filter, planned_questions)
  values (p_user_id, p_subject_id, p_mode, p_topic_filter, p_planned)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.record_answer(
  p_user_id text,
  p_session_id uuid,
  p_question_id uuid,
  p_correct boolean,
  p_attempt_text text default null,
  p_time_ms int default null
) returns table (xp_gained int, streak_bonus boolean, session_correct int, session_total int, session_xp int)
language plpgsql as $$
declare
  v_owner text;
  v_streak int := 0;
  v_xp int;
  v_bonus boolean := false;
  v_prow record;
  v_rec record;
  v_box int;
  v_next timestamptz;
begin
  select user_id into v_owner from public.sessions where id = p_session_id;
  if v_owner is null or v_owner <> p_user_id then raise exception 'session not found'; end if;
  if not exists (select 1 from public.questions q where q.id = p_question_id and q.user_id = p_user_id) then
    raise exception 'question not found';
  end if;

  for v_rec in
    select correct from public.answers a
    where a.session_id = p_session_id and a.user_id = p_user_id
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
  values (p_user_id, p_question_id, p_session_id, p_correct, v_xp, v_bonus, p_attempt_text, p_time_ms);

  select * into v_prow from public.question_progress where user_id = p_user_id and question_id = p_question_id;
  if v_prow is null then
    insert into public.question_progress (user_id, question_id, box, times_correct, times_wrong, last_answered_at, next_review_at)
    values (p_user_id, p_question_id, 1,
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
      where user_id = p_user_id and question_id = p_question_id;
  end if;

  update public.sessions s set
    correct = s.correct + case when p_correct then 1 else 0 end,
    total = s.total + 1,
    xp_gained = s.xp_gained + v_xp
  where s.id = p_session_id;

  return query select v_xp, v_bonus,
    (select s.correct from public.sessions s where s.id = p_session_id),
    (select s.total from public.sessions s where s.id = p_session_id),
    (select s.xp_gained from public.sessions s where s.id = p_session_id);
end $$;

create or replace function public.complete_session(
  p_user_id text,
  p_session_id uuid
) returns table (session_correct int, session_total int, session_xp int, new_xp int, streak int, level int, new_achievements jsonb)
language plpgsql as $$
declare
  v_owner text;
  v_correct int; v_total int; v_sxp int;
  v_streak int; v_last date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := v_today - 1;
  v_profile_xp int;
  v_level int;
  v_masters int;
  v_new_ach jsonb := '[]'::jsonb;
begin
  select s.user_id, s.correct, s.total, s.xp_gained into v_owner, v_correct, v_total, v_sxp
  from public.sessions s where s.id = p_session_id;
  if v_owner is null or v_owner <> p_user_id then raise exception 'session not found'; end if;

  update public.sessions set finished_at = now() where id = p_session_id;

  select p.streak, p.last_study_date into v_streak, v_last from public.profiles p where p.id = p_user_id;
  if v_last is null or v_last < v_yesterday then v_streak := 1;
  elsif v_last = v_yesterday then v_streak := v_streak + 1;
  end if;
  update public.profiles p set
    streak = v_streak,
    last_study_date = v_today,
    xp = p.xp + v_sxp
  where p.id = p_user_id;

  select p.xp into v_profile_xp from public.profiles p where p.id = p_user_id;
  v_level := floor(v_profile_xp / 1000.0)::int + 1;

  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'first_session')
     and (select count(*) from public.sessions where user_id = p_user_id and finished_at is not null) >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'first_session');
    v_new_ach := v_new_ach || jsonb_build_object('id','first_session','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'perfect_week')
     and v_streak >= 7 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'perfect_week');
    v_new_ach := v_new_ach || jsonb_build_object('id','perfect_week','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'hundred_questions')
     and (select count(*) from public.answers where user_id = p_user_id) >= 100 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'hundred_questions');
    v_new_ach := v_new_ach || jsonb_build_object('id','hundred_questions','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'consistent_30')
     and v_streak >= 30 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'consistent_30');
    v_new_ach := v_new_ach || jsonb_build_object('id','consistent_30','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'perfect_session')
     and v_total >= 10 and v_correct = v_total then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'perfect_session');
    v_new_ach := v_new_ach || jsonb_build_object('id','perfect_session','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'ten_sessions')
     and (select count(*) from public.sessions where user_id = p_user_id and finished_at is not null) >= 10 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'ten_sessions');
    v_new_ach := v_new_ach || jsonb_build_object('id','ten_sessions','unlocked_at', now());
  end if;

  select count(*) into v_masters from (
    select su.id from public.subjects su
    join public.questions qu on qu.subject_id = su.id
    join public.answers an on an.question_id = qu.id and an.user_id = p_user_id
    where su.archived = false
    group by su.id
    having count(*) >= 20 and (avg((an.correct)::int) >= 0.9)
  ) as m;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'subject_master')
     and v_masters >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'subject_master');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = p_user_id and achievement_id = 'subject_master_x3')
     and v_masters >= 3 then
    insert into public.user_achievements (user_id, achievement_id) values (p_user_id, 'subject_master_x3');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master_x3','unlocked_at', now());
  end if;

  return query select v_correct, v_total, v_sxp, v_profile_xp, v_streak, v_level, v_new_ach;
end $$;

create or replace function public.review_flashcard(
  p_user_id text,
  p_question_id uuid,
  p_correct boolean
) returns table (box int, xp_gained int)
language plpgsql as $$
declare
  v_prow record;
  v_box int;
  v_xp int := case when p_correct then 10 else 3 end;
begin
  if not exists (select 1 from public.questions q where q.id = p_question_id and q.user_id = p_user_id) then
    raise exception 'question not found';
  end if;

  insert into public.answers (user_id, question_id, session_id, correct, xp_gained, streak_bonus, attempt_text, time_ms)
  values (p_user_id, p_question_id, null, p_correct, v_xp, false, null, null);

  select * into v_prow from public.question_progress where user_id = p_user_id and question_id = p_question_id;
  if v_prow is null then
    v_box := case when p_correct then 2 else 1 end;
    insert into public.question_progress (user_id, question_id, box, times_correct, times_wrong, last_answered_at, next_review_at)
    values (p_user_id, p_question_id, v_box,
            case when p_correct then 1 else 0 end,
            case when p_correct then 0 else 1 end,
            now(), now() + case v_box when 1 then interval '1 day' when 2 then interval '3 days'
                          when 3 then interval '7 days' when 4 then interval '14 days' else interval '30 days' end);
  else
    v_box := case when p_correct then least(v_prow.box + 1, 5) else 1 end;
    update public.question_progress set
      box = v_box,
      times_correct = times_correct + case when p_correct then 1 else 0 end,
      times_wrong = times_wrong + case when p_correct then 0 else 1 end,
      last_answered_at = now(),
      next_review_at = now() + case v_box when 1 then interval '1 day' when 2 then interval '3 days'
                          when 3 then interval '7 days' when 4 then interval '14 days' else interval '30 days' end
      where user_id = p_user_id and question_id = p_question_id;
  end if;

  update public.profiles p set xp = p.xp + v_xp where p.id = p_user_id;

  return query select v_box, v_xp;
end $$;
