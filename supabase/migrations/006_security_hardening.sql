-- 006_security_hardening.sql — endurecimento de segurança (RPCs + limite de IA)
-- Rodar no SQL Editor do Supabase (Dashboard → SQL). Idempotente: pode rodar de novo.
--
-- 1) start_session: passa a exigir que a matéria pertença ao usuário.
-- 2) record_answer: passa a exigir que a questão pertença ao usuário
--    (antes era possível registrar respostas/aprogresso contra questões de terceiros).
-- 3) ai_log: tabela usada pela Edge Function ai-tools para limitar o uso diário
--    (controle de custo/abuso; sem isso qualquer usuário autenticado podia chamar
--    o Gemini ilimitadamente).

-- ===== ai_log =====
create table if not exists public.ai_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  action text,
  created_at timestamptz not null default now()
);
alter table public.ai_log enable row level security;
drop policy if exists "ai_log_select" on public.ai_log;
create policy "ai_log_select" on public.ai_log for select to authenticated using (auth.uid() = user_id);

-- ===== start_session com checagem de posse =====
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
  if not exists (select 1 from public.subjects s where s.id = p_subject_id and s.user_id = v_user) then
    raise exception 'subject not found';
  end if;
  insert into public.sessions (user_id, subject_id, mode, topic_filter, planned_questions)
  values (v_user, p_subject_id, p_mode, p_topic_filter, p_planned)
  returning id into v_id;
  return v_id;
end $$;

-- ===== record_answer com checagem de posse da questão =====
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
  if not exists (select 1 from public.questions q where q.id = p_question_id and q.user_id = v_user) then
    raise exception 'question not found';
  end if;

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