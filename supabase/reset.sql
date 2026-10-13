-- reset.sql — APAGA TODAS as contas e dados do OmniLearn.
-- Rodar no SQL Editor do Supabase (Dashboard → SQL). AÇÃO IRREVERSÍVEL.
--
-- O que faz:
--   * remove os arquivos do Storage (materiais e avatares)
--   * limpa os dados de todos os usuários (o catálogo "achievements" é preservado)
--   * apaga as contas do Auth (as linhas restantes caem por ON DELETE CASCADE)
--
-- Observação: o DELETE em storage.objects remove os metadados, mas nem sempre o
-- binário no S3. Se sobrar arquivo, esvazie os buckets "materials" e "avatars"
-- manualmente em Storage no Dashboard.

-- 1) objetos do Storage
delete from storage.objects where bucket_id in ('materials', 'avatars');

-- 2) dados de todos os usuários (achievements fica intacto)
truncate table
  public.user_achievements,
  public.question_progress,
  public.generation_log,
  public.answers,
  public.sessions,
  public.questions,
  public.materials,
  public.subjects,
  public.profiles
cascade;

-- 3) contas do Auth
delete from auth.users;
