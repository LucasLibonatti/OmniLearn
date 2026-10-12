import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Clock } from 'lucide-react';
import { Btn, Bar, Card } from './ui';
import { EmptyState, ErrorState, Spinner } from './components/states';
import { useAuth } from './auth';
import { getSubject } from './services/subjects';
import { completeSession, getSession, recordAnswer, sessionAnsweredIds } from './services/sessions';
import { selectQuestions } from './engine/adaptive';
import type { Question, SessionRow, Subject } from './types';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export default function Session() {
  const { id } = useParams();
  const nav = useNavigate();
  const { session: authSession } = useAuth();
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
  const [secs, setSecs] = useState(900);
  const qStart = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || !userId) return;
      try {
        const s = await getSession(id);
        if (!s) {
          setError('Sessão não encontrada.');
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
        if (alive) setError(e instanceof Error ? e.message : 'Erro ao carregar a sessão.');
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
    qStart.current = Date.now();
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
      setError('Não conseguimos salvar sua resposta. Confira sua internet e tente novamente.');
    }
  };

  const check = async (v: string) => {
    if (ok !== null || saving || !qs[idx]) return;
    const q = qs[idx];
    const correct =
      q.type === 'short'
        ? !!q.accept?.some((a) => norm(v).includes(a))
        : q.type === 'match'
          ? (q.pairs ?? []).every(([a, b]) => mt[a] === b)
          : v === q.answer;
    setSel(v);
    setOk(correct);
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
      setError(e instanceof Error ? e.message : 'Erro ao concluir a sessão.');
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

  if (loading) return <Spinner label="Carregando a sessão…" />;
  if (error) return <div className="max-w-xl mx-auto p-5"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
  if (!sess) return null;

  if (!q) {
    return (
      <div className="min-h-screen grid place-items-center p-5">
        <div className="max-w-md w-full">
          <EmptyState
            icon="✅"
            title="Você já respondeu todas as questões desta sessão."
            action={<Btn onClick={finish} disabled={closing}>{closing ? 'Concluindo…' : 'Ver resultado'}</Btn>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-5 flex flex-col">
      <div className="flex items-center gap-3">
        <button
          aria-label="Sair da sessão"
          onClick={() => {
            if (confirm('Sair? Sua sessão fica salva e você pode continuar depois.')) nav('/dashboard');
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
        {subject?.name ?? 'Sessão'} · Questão {Math.min(answered + (ok === null ? 1 : 0), total)} de {total} ·{' '}
        <span className="text-amber-600">{xp} XP</span>
      </p>

      <div key={idx} className="fade flex-1">
        <h1 className="text-2xl font-extrabold mt-4">{q.prompt}</h1>
        <div className="mt-6 grid gap-3 relative">
          {q.type !== 'match' && q.type !== 'short' &&
            (q.options ?? []).map((o, k) => {
              const right = ok !== null && o === q.answer;
              const wrong = ok === false && sel === o;
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
                  <select
                    aria-label={a}
                    disabled={ok !== null}
                    value={mt[a] ?? ''}
                    onChange={(e) => setMt({ ...mt, [a]: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 p-2"
                  >
                    <option value="">Escolha…</option>
                    {(q.pairs ?? []).map(([, b]) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {ok === null && (
                <Btn onClick={() => check(JSON.stringify(mt))} disabled={Object.keys(mt).length < (q.pairs?.length ?? 0)}>
                  Verificar
                </Btn>
              )}
            </>
          )}

          {q.type === 'short' && (
            <>
              <input
                aria-label="Sua resposta"
                value={txt}
                disabled={ok !== null}
                onChange={(e) => setTxt(e.target.value)}
                placeholder="Digite sua resposta"
                className="rounded-2xl border-2 border-slate-200 px-4 py-4"
              />
              {ok === null && (
                <Btn onClick={() => check(txt)} disabled={!txt.trim()}>
                  Verificar
                </Btn>
              )}
            </>
          )}

          {ok !== null && (
            <span key={idx} className="xp absolute right-2 -top-6 font-extrabold text-amber-500 text-xl pointer-events-none">
              +{gain} XP{bonus ? ' 🔥' : ''}
            </span>
          )}
        </div>
      </div>

      {ok !== null && (
        <Card className={`pop mt-4 ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="font-extrabold">{ok ? '✓ Muito bem! Você acertou.' : '✕ Ainda não!'}</p>
          {!ok && (
            <p className="font-semibold">
              Resposta correta: {q.type === 'match' ? (q.pairs ?? []).map((p) => p.join(' → ')).join(' · ') : q.answer}
            </p>
          )}
          <p className="text-sm text-slate-700 mt-1">{q.explanation}</p>
          <Btn className="w-full mt-4" onClick={next} disabled={closing}>
            {idx + 1 < qs.length ? (ok ? 'Continuar' : 'Entendi') : closing ? 'Concluindo…' : 'Ver resultado'}
          </Btn>
        </Card>
      )}

      {secs === 0 && ok === null && (
        <p className="mt-3 text-sm font-semibold text-red-500">
          O tempo acabou — responda esta questão (a última) e vamos encerrar.
        </p>
      )}
    </div>
  );
}
