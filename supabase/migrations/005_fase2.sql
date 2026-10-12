-- 005: recursos da fase 2
--   * profiles.daily_goal  -> meta diária de questões (configurável pelo usuário)
--   * review_flashcard()   -> nota um flashcard (revisão espaçada) fora de uma sessão

alter table public.profiles add column if not exists daily_goal int not null default 18;

create or replace function public.review_flashcard(p_question_id uuid, p_correct boolean)
returns table (box int, xp_gained int)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_prow record;
  v_box int;
  v_xp int := case when p_correct then 10 else 3 end;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.questions q where q.id = p_question_id and q.user_id = v_user) then
    raise exception 'question not found';
  end if;

  insert into public.answers (user_id, question_id, session_id, correct, xp_gained, streak_bonus, attempt_text, time_ms)
  values (v_user, p_question_id, null, p_correct, v_xp, false, null, null);

  select * into v_prow from public.question_progress where user_id = v_user and question_id = p_question_id;
  if v_prow is null then
    v_box := case when p_correct then 2 else 1 end;
    insert into public.question_progress (user_id, question_id, box, times_correct, times_wrong, last_answered_at, next_review_at)
    values (v_user, p_question_id, v_box,
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
      where user_id = v_user and question_id = p_question_id;
  end if;

  update public.profiles p set xp = p.xp + v_xp where p.id = v_user;

  return query select v_box, v_xp;
end $$;
