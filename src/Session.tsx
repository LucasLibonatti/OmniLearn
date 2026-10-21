import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, X, Clock, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Btn, Bar, Card, Select } from './ui';
import { Icon } from './icons';
import { shuffle } from './lib/shuffle';
import { isShortAnswerCorrect } from './lib/answerMatch';
import { EmptyState, ErrorState, Spinner } from './components/states';
import { confirmDialog } from './components/confirm';
import { useAuth } from './auth';
import { useI18n } from './i18n';
import { useSettings } from './hooks/useSettings';
import { getSubject } from './services/subjects';
import { completeSession, getSession, recordAnswer, sessionAnsweredIds } from './services/sessions';
import { explainQuestion } from './services/ai';
import { selectQuestions } from './engine/adaptive';
import { playCorrect, playWrong } from './lib/sound';
import type { Question, SessionRow, Subject } from './types';

export default function Session() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const exam = params.get('exam') === '1';
  const nav = useNavigate();
  const { session: authSession } = useAuth();
  const { sound } = useSettings();
  const { tr } = useI18n();
  const userId = authSession?.user.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sess, setSess] = useState<SessionRow | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [xp, setXp] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [closing, setClosing] = useState(false);

  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [txt, setTxt] = useState('');
  const [mt, setMt] = useState<Record<string, string>>({});
  const [gain, setGain] = useState(0);
  const [bonus, setBonus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explainErr, setExplainErr] = useState<string | null>(null);
  const [secs, setSecs] = useState(900);
  const qStart = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || !userId) return;
      try {
        const s = await getSession(id);
        if (!s) {
          setError(tr('Sessão não encontrada.'));
          return;
        }
        if (s.finished_at) {
          nav(`/resultado/${s.id}`, { replace: true });
          return;
        }
        const answeredIds = await sessionAnsweredIds(s.id);
        const subj = s.subject_id ? await getSubject(s.subject_id) : null;
        const list = s.subject_id
          ? await selectQuestions({
              userId,
              subjectId: s.subject_id,
              mode: s.mode,
              topicFilter: s.topic_filter,
              planned: s.planned_questions,
              excludeIds: answeredIds,
            })
          : [];
        if (!alive) return;
        setSess(s);
        setSubject(subj);
        setXp(s.xp_gained);
        setAnswered(s.total);
        setQs(list);
        setTotal(s.total + list.length);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : tr('Erro ao carregar a sessão.'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, userId, nav]);

  useEffect(() => {
    if (!sess) return;
    const end = new Date(sess.started_at).getTime() + sess.minutes * 60000;
    const upd = () => setSecs(Math.max(0, Math.round((end - Date.now()) / 1000)));
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, [sess]);

  const reset = () => {
    setSel(null);
    setOk(null);
    setTxt('');
    setMt({});
    setGain(0);
    setBonus(false);
    setExplain(null);
    setExplainErr(null);
    setExplaining(false);
    qStart.current = Date.now();
  };

  const askExplain = async () => {
    const cur = qs[idx];
    if (!cur) return;
    setExplaining(true);
    setExplainErr(null);
    try {
      setExplain(await explainQuestion(cur.id));
    } catch (e) {
      setExplainErr((e as Error).message);
    } finally {
      setExplaining(false);
    }
  };

  const save = async (correct: boolean, attempt: string) => {
    if (!sess) return;
    const q = qs[idx];
    const timeMs = Date.now() - qStart.current;
    try {
      const res = await recordAnswer({ sessionId: sess.id, questionId: q.id, correct, attemptText: attempt, timeMs });
      setGain(res.xp_gained);
      setBonus(res.streak_bonus);
      setXp(res.session_xp);
      setAnswered(res.session_total);
    } catch {
      setError(tr('Não conseguimos salvar sua resposta. Confira sua internet e tente novamente.'));
    }
  };

  const check = async (v: string) => {
    if (ok !== null || saving || !qs[idx]) return;
    const q = qs[idx];
    const correct =
      q.type === 'short'
        ? isShortAnswerCorrect(v, q.answer, q.accept)
        : q.type === 'match'
          ? (q.pairs ?? []).every(([a, b]) => mt[a] === b)
          : v === q.answer;
    setSel(v);
    setOk(correct);
    if (sound && !exam) (correct ? playCorrect : playWrong)();
    setSaving(true);
    await save(correct, v);
    setSaving(false);
  };

  const finish = async () => {
    if (!sess || closing) return;
    setClosing(true);
    try {
      await completeSession(sess.id);
      nav(`/resultado/${sess.id}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('Erro ao concluir a sessão.'));
      setClosing(false);
    }
  };

  const next = () => {
    if (idx + 1 < qs.length) {
      setIdx(idx + 1);
      reset();
    } else {
      finish();
    }
  };

  const mm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const q = qs[idx];
  const revealed = !exam && ok !== null;

  const options = useMemo(() => shuffle(q?.options ?? []), [q?.id]);

  // match: opções deduplicadas e controle de seleção única
  const matchOptions = useMemo(() => {
    if (q?.type !== 'match') return [];
    const all = (q.pairs ?? []).map(([, b]) => b);
    return [...new Set(all)];
  }, [q?.id, q?.type]);

  const usedMatchValues = useMemo(() => {
    const used = new Set<string>();
    for (const val of Object.values(mt)) {
      if (val) used.add(val);
    }
    return used;
  }, [mt]);

  if (loading) return <Spinner label={tr('Carregando a sessão…')} />;
  if (error) return <div className="max-w-xl mx-auto p-5"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
  if (!sess) return null;

  if (!q) {
    return (
      <div className="min-h-screen grid place-items-center p-5">
        <div className="max-w-md w-full">
          <EmptyState
            icon="✅"
            title={tr('Você já respondeu todas as questões desta sessão.')}
            action={
              <Btn onClick={finish} disabled={closing}>
                {closing ? tr('Concluindo…') : tr('Ver resultado')}
              </Btn>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-5 flex flex-col">
      <div className="flex items-center gap-3">
        <button
          aria-label={tr('Sair da sessão')}
          onClick={async () => {
            const confirmed = await confirmDialog({
              title: tr('Sair da sessão'),
              message: tr('Sair? Sua sessão fica salva e você pode continuar depois.'),
              confirmLabel: tr('Sair'),
            });
            if (confirmed) nav('/dashboard');
          }}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          <X size={22} />
        </button>
        <div className="flex-1">
          <Bar v={total ? (answered / total) * 100 : 0} />
        </div>
        <span className={`inline-flex items-center gap-1 font-mono font-bold ${secs === 0 ? 'text-red-500' : 'text-slate-600'}`}>
          <Clock size={16} />
          {mm}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {exam ? tr('🎓 Modo prova · ') : ''}
        {subject?.name ?? tr('Sessão')} ·{' '}
        {tr('Questão {n} de {total}', { n: Math.min(answered + (ok === null ? 1 : 0), total), total })} ·{' '}
        <span className="text-amber-600">{xp} XP</span>
      </p>

      <div key={idx} className="fade flex-1">
        <h1 className="text-2xl font-extrabold mt-4">{q.prompt}</h1>
        <div className="mt-6 grid gap-3 relative">
          {q.type !== 'match' && q.type !== 'short' &&
            options.map((o, k) => {
              const right = revealed && o === q.answer;
              const wrong = revealed && ok === false && sel === o;
              return (
                <button
                  key={o}
                  onClick={() => check(o)}
                  disabled={ok !== null}
                  className={`flex items-center gap-3 text-left rounded-2xl border-2 px-4 py-4 font-medium transition ${right ? 'border-emerald-500 bg-emerald-50 pop' : wrong ? 'border-red-300 bg-red-50 shake' : 'border-slate-200 bg-white hover:border-indigo-400'}`}
                >
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-bold">{'ABCD'[k]}</span>
                  {o}
                  {right && <Check className="ml-auto text-emerald-600" />}
                  {wrong && <X className="ml-auto text-red-500" />}
                </button>
              );
            })}

          {q.type === 'match' && (
            <>
              {(q.pairs ?? []).map(([a]) => (
                <div key={a} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className="font-semibold w-32">{a}</span>
                  <Select
                    ariaLabel={a}
                    disabled={ok !== null}
                    value={mt[a] ?? ''}
                    onChange={(v) => setMt({ ...mt, [a]: v })}
                    options={matchOptions.filter(
                      (opt) => opt === mt[a] || !usedMatchValues.has(opt),
                    )}
                    className="flex-1 min-w-0"
                  />
                </div>
              ))}
              {ok === null && (
                <Btn onClick={() => check(JSON.stringify(mt))} disabled={Object.keys(mt).length < (q.pairs?.length ?? 0)}>
                  {tr('Verificar')}
                </Btn>
              )}
            </>
          )}

          {q.type === 'short' && (
            <>
              <input
                aria-label={tr('Sua resposta')}
                value={txt}
                disabled={ok !== null}
                onChange={(e) => setTxt(e.target.value)}
                placeholder={tr('Digite sua resposta')}
                className="rounded-2xl border-2 border-slate-200 px-4 py-4"
              />
              {ok === null && (
                <Btn onClick={() => check(txt)} disabled={!txt.trim()}>
                  {tr('Verificar')}
                </Btn>
              )}
            </>
          )}

          {revealed && (
            <span
              key={idx}
              className="xp absolute right-2 -top-6 inline-flex items-center gap-1 font-extrabold text-amber-500 text-xl pointer-events-none"
            >
              +{gain} XP{bonus && <Icon name="fogo30" size={22} />}
            </span>
          )}
        </div>
      </div>

      {ok !== null && exam && (
        <Card className="pop mt-4 bg-indigo-50 border-indigo-200">
          <p className="font-extrabold">{tr('✓ Resposta registrada.')}</p>
          <p className="text-sm text-slate-600 mt-1">{tr('No modo prova você vê o resultado só no final.')}</p>
          <Btn className="w-full mt-4" onClick={next} disabled={closing}>
            {idx + 1 < qs.length ? tr('Continuar') : closing ? tr('Concluindo…') : tr('Ver resultado')}
          </Btn>
        </Card>
      )}

      {ok !== null && !exam && (
        <Card className={`pop mt-4 ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="font-extrabold">{ok ? tr('✓ Muito bem! Você acertou.') : tr('✕ Ainda não!')}</p>
          {!ok && (
            <p className="font-semibold">
              {tr('Resposta correta: ')}
              {q.type === 'match' ? (q.pairs ?? []).map((p) => p.join(' → ')).join(' · ') : q.answer}
            </p>
          )}
          <p className="text-sm text-slate-700 mt-1">{q.explanation}</p>

          {!ok && !explain && (
            <button
              onClick={askExplain}
              disabled={explaining}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Sparkles size={16} />
              {explaining ? tr('Pensando…') : tr('Explique de novo')}
            </button>
          )}
          {/* TAREFA 5: Card de explicação da IA com paleta consistente e alto contraste */}
          {explain && (
            <div className="mt-3 rounded-2xl bg-indigo-50/90 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-500/30 p-4">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 inline-flex items-center gap-1.5">
                <Icon name="estrela" size={16} /> {tr('Explicação da IA')}
              </p>
              <div
                className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line [&_strong]:font-semibold [&_strong]:text-indigo-950 dark:[&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explain, { ALLOWED_TAGS: ['strong'] }) }}
              />
            </div>
          )}
          {explainErr && <p className="text-sm text-red-500 mt-2">{explainErr}</p>}

          <Btn className="w-full mt-4" onClick={next} disabled={closing}>
            {idx + 1 < qs.length
              ? ok
                ? tr('Continuar')
                : tr('Entendi')
              : closing
                ? tr('Concluindo…')
                : tr('Ver resultado')}
          </Btn>
        </Card>
      )}

      {secs === 0 && ok === null && (
        <p className="mt-3 text-sm font-semibold text-red-500">
          {tr('O tempo acabou — responda esta questão (a última) e vamos encerrar.')}
        </p>
      )}
    </div>
  );
}
