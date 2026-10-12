-- 003: corrige erros de ambiguidade nas funções RPC que impediam salvar respostas.
--   * record_answer: a coluna xp_gained ficava ambígua com o nome de saída da própria função (erro 42702)
--   * complete_session: a coluna streak ficava ambígua com o parâmetro de saída (erro 42702)
--   * complete_session: v_level era reaproveitada para contar matérias, corrompendo o nível retornado
-- Rode este arquivo inteiro no SQL Editor do Supabase (substitui as funções).

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
  v_masters int;
  v_new_ach jsonb := '[]'::jsonb;
  v_hit boolean;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select s.user_id, s.correct, s.total, s.xp_gained into v_user, v_correct, v_total, v_sxp
  from public.sessions s where s.id = p_session_id;
  if v_user is null then raise exception 'session not found'; end if;

  update public.sessions set finished_at = now() where id = p_session_id;

  select p.streak, p.last_study_date into v_streak, v_last from public.profiles p where p.id = v_user;
  if v_last is null or v_last < v_yesterday then v_streak := 1;
  elsif v_last = v_yesterday then v_streak := v_streak + 1;
  end if;
  update public.profiles p set
    streak = v_streak,
    last_study_date = v_today,
    xp = p.xp + v_sxp
  where p.id = v_user;

  select p.xp into v_profile_xp from public.profiles p where p.id = v_user;
  v_level := floor(v_profile_xp / 1000.0)::int + 1;

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

  select count(*) into v_masters from (
    select su.id from public.subjects su
    join public.questions qu on qu.subject_id = su.id
    join public.answers an on an.question_id = qu.id and an.user_id = v_user
    where su.archived = false
    group by su.id
    having count(*) >= 20 and (avg((an.correct)::int) >= 0.9)
  ) as m;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'subject_master')
     and v_masters >= 1 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'subject_master');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master','unlocked_at', now());
  end if;
  if not exists (select 1 from public.user_achievements where user_id = v_user and achievement_id = 'subject_master_x3')
     and v_masters >= 3 then
    insert into public.user_achievements (user_id, achievement_id) values (v_user, 'subject_master_x3');
    v_new_ach := v_new_ach || jsonb_build_object('id','subject_master_x3','unlocked_at', now());
  end if;

  return query select v_correct, v_total, v_sxp, v_profile_xp, v_streak, v_level, v_new_ach;
end $$;
