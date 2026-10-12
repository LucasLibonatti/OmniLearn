import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Home,
  BookOpen,
  BarChart3,
  Trophy,
  User,
  Plus,
  Upload,
  FileText,
  Lock,
  Sparkles,
  LogOut,
  Pencil,
  Trash2,
  Archive,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Camera,
  ScrollText,
  Printer,
  Share2,
  Layers,
} from 'lucide-react';
import { Avatar, Btn, Card, Bar, Ring, Logo } from './ui';
import { EmptyState, ErrorState, Generating, Skeleton, Spinner } from './components/states';
import { useAuth } from './auth';
import { useAsync } from './hooks/useAsync';
import { useSettings } from './hooks/useSettings';
import { useProfile, useSubjects } from './hooks/useApp';
import {
  archiveSubject,
  createSubject,
  deleteSubject,
  getSubject,
  getSubjectStats,
  listSubjects,
  renameSubject,
} from './services/subjects';
import { getProfile, updateDailyGoal, updateProfileName, uploadAvatar } from './services/profile';
import {
  countMaterials,
  createTextMaterial,
  listMaterials,
  setMaterialError,
  setMaterialExtracted,
  uploadMaterial,
} from './services/materials';
import { countQuestions, listQuestions } from './services/questions';
import { gradeFlashcard, reviewQueue, type Flashcard } from './services/flashcards';
import { summarizeSubject } from './services/ai';
import { shareText } from './lib/share';
import { completeSession, getSession, pendingSession, sessionTopicBreakdown, startSession } from './services/sessions';
import { generateQuestions } from './services/generation';
import { deleteAccount } from './services/account';
import * as statsApi from './services/stats';
import { listAchievements, newlyUnlocked } from './services/achievements';
import { extractText } from './lib/extract';
import { formatDate, greeting, lastNDates, shortAgo, todaySP, weekLabel } from './lib/dates';
import { xpInLevel, XP_PER_LEVEL } from './engine/xp';
import type { Material, SubjectWithStats } from './types';

const nav = [
  { to: '/dashboard', label: 'Início', icon: Home },
  { to: '/materias', label: 'Minhas matérias', icon: BookOpen },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { to: '/conquistas', label: 'Conquistas', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: User },
];

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition shrink-0 ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

export function Layout() {
  const { data: profile } = useProfile();
  const { session, signOut } = useAuth();
  const { theme, sound, reminder, toggleTheme, toggleSound } = useSettings();
  const loc = useLocation();
  const today = useAsync(() => (session?.user.id ? statsApi.answeredToday(session.user.id) : Promise.resolve(0)), [session?.user.id]);
  const name = profile?.name ?? 'Estudante';
  useEffect(() => {
    if (!reminder) return;
    const check = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const key = 'omni-reminder-shown';
      const day = new Date().toDateString();
      if (localStorage.getItem(key) === day) return;
      if (new Date().getHours() < 19) return;
      const goal = profile?.daily_goal ?? 18;
      const done = today.data ?? 0;
      if (done >= goal) return;
      new Notification('Hora de estudar! 📚', {
        body: done > 0 ? `Você fez ${done} de ${goal} questões hoje. Bora manter a sequência?` : 'Você ainda não estudou hoje. Bora manter a sequência?',
      });
      localStorage.setItem(key, day);
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [reminder, profile?.daily_goal, today.data]);
  return (
    <div className="min-h-screen md:pl-64">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-100 p-5">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            to="/diretrizes"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <ScrollText size={20} />
            Diretrizes
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={name} src={profile?.avatar_url} size={40} />
            <div className="text-sm min-w-0">
              <p className="font-semibold truncate">{name}</p>
              <p className="text-slate-500">Nível {profile?.level ?? 1}</p>
            </div>
            <div className="ml-auto flex items-center">
              <button
                aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
                onClick={toggleTheme}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                aria-label="Sair"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main key={loc.pathname} className="max-w-5xl mx-auto p-5 md:p-10 pb-28 fade">
        <Outlet />
      </main>
      <nav aria-label="Mobile" className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex justify-around py-2 z-10">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-[11px] gap-0.5 px-2 py-1 ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`
            }
          >
            <n.icon size={22} />
            {n.label.replace('Minhas ', '')}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Week({ dates }: { dates: string[] }) {
  const set = new Set(dates);
  return (
    <div className="flex gap-2">
      {lastNDates(7).map((d) => {
        const on = set.has(d);
        return (
          <div key={d} className="flex-1 text-center">
            <div className="text-[10px] font-bold text-slate-400">{weekLabel(d)}</div>
            <div
              className={`mt-1 grid place-items-center h-8 rounded-xl font-bold ${on ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'}`}
            >
              {on ? '✓' : '·'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SubjectCard({
  s,
  manage = false,
  onChanged,
}: {
  s: SubjectWithStats;
  manage?: boolean;
  onChanged?: () => void;
}) {
  const nav2 = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || name === s.name) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await renameSubject(s.id, name.trim());
      setEditing(false);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };
  const archive = async () => {
    if (!confirm(`Arquivar "${s.name}"? Você pode reativar depois.`)) return;
    setBusy(true);
    try {
      await archiveSubject(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Excluir "${s.name}"? Isto apaga as questões, materiais e arquivos enviados.`)) return;
    setBusy(true);
    try {
      await deleteSubject(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition">
      <div className="flex justify-between items-start gap-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-bold"
            autoFocus
          />
        ) : (
          <span className={`rounded-xl px-3 py-1 text-sm font-bold ${s.tone ?? 'bg-slate-100 text-slate-700'}`}>{s.name}</span>
        )}
        <span className="text-sm text-orange-500 font-semibold">🔥 {s.streak}</span>
      </div>
      <h3 className="font-bold text-lg mt-3">{s.topic || s.name}</h3>
      <p className="text-sm text-slate-500">
        {s.questions} questões · Última sessão: {shortAgo(s.last_session)}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <Bar v={s.progress} />
        </div>
        <span className="text-sm font-bold">{s.progress}%</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Btn className="flex-1" onClick={() => nav2(`/sessao/configurar/${s.id}`)} disabled={!s.questions}>
          {s.questions ? 'Estudar' : 'Sem questões'}
        </Btn>
        <Btn v="s" to={`/materias/${s.id}`}>
          Abrir
        </Btn>
      </div>
      {manage && (
        <div className="mt-2 flex justify-end items-center gap-1 text-slate-400">
          {editing ? (
            <button onClick={save} disabled={busy} className="px-2 py-1 text-xs font-semibold text-indigo-600">
              Salvar
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 hover:text-indigo-600" aria-label="Renomear">
              <Pencil size={16} />
            </button>
          )}
          <button onClick={archive} disabled={busy} className="p-2 hover:text-slate-700" aria-label="Arquivar">
            <Archive size={16} />
          </button>
          <button onClick={remove} disabled={busy} className="p-2 hover:text-red-600" aria-label="Excluir">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </Card>
  );
}

export function Dashboard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: profile } = useProfile();
  const subjects = useSubjects();
  const today = useAsync(() => (userId ? statsApi.answeredToday(userId) : Promise.resolve(0)), [userId]);
  const week = useAsync(() => (userId ? statsApi.studiedDates(userId, 7) : Promise.resolve<string[]>([])), [userId]);
  const pending = useAsync(() => (userId ? pendingSession(userId) : Promise.resolve(null)), [userId]);
  const weak = useAsync(() => (userId ? statsApi.weakSpots(userId) : Promise.resolve([])), [userId]);

  const name = (profile?.name ?? 'Estudante').split(' ')[0];
  const done = today.data ?? 0;
  const goal = profile?.daily_goal ?? 18;
  const streak = profile?.streak ?? 0;
  const breaking = streak > 0 && profile?.last_study_date !== todaySP();
  const subjectsData = subjects.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">
          {greeting()}, {name} 👋
        </h1>
        <p className="text-slate-600">Pronto para estudar hoje?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <p className="text-5xl">🔥</p>
          <p className="text-4xl font-extrabold mt-2">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
          <p className="text-slate-600">
            {streak === 0 ? 'Comece sua sequência hoje!' : 'Você está em uma sequência incrível!'}
          </p>
          <div className="mt-4">
            <Week dates={week.data ?? []} />
          </div>
        </Card>
        <Card className="md:col-span-2 flex flex-col">
          <p className="font-bold">Sessão de hoje</p>
          <p className="text-sm text-slate-500 mt-1">
            {done} / {goal} questões respondidas hoje
          </p>
          <div className="mt-3">
            <Bar v={Math.min(100, (done / goal) * 100)} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 mt-auto">
            <p className="text-sm text-slate-500">{breaking ? 'Não deixe sua sequência quebrar!' : 'Continue assim!'}</p>
            {pending.data ? (
              <Btn to={`/sessao/${pending.data.id}`}>Continuar sessão</Btn>
            ) : subjectsData.length ? (
              <Btn to={`/sessao/configurar/${subjectsData[0].id}`} disabled={!subjectsData[0].questions}>
                Começar sessão de hoje
              </Btn>
            ) : (
              <Btn to="/materias/nova">Criar minha primeira matéria</Btn>
            )}
          </div>
        </Card>
      </div>

      {subjects.loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : subjects.error ? (
        <ErrorState message={subjects.error} onRetry={subjects.reload} />
      ) : subjectsData.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Bem-vindo ao OmniLearn!"
          desc="Crie sua primeira matéria, envie seus slides e deixe a IA montar seus exercícios."
          action={<Btn to="/materias/nova">Criar minha primeira matéria</Btn>}
        />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {subjectsData.slice(0, 3).map((s) => (
            <SubjectCard key={s.id} s={s} />
          ))}
        </div>
      )}

      <Card>
        <h2 className="font-bold text-lg">Seus pontos de atenção</h2>
        {weak.loading ? (
          <Skeleton className="h-16 mt-3" />
        ) : (weak.data ?? []).length === 0 ? (
          <p className="text-slate-600 text-sm mt-2">Nenhum ponto fraco por aqui. Continue assim! 💪</p>
        ) : (
          <>
            <p className="text-slate-600 text-sm">Com base nas suas últimas respostas, recomendamos revisar:</p>
            <ul className="my-4 space-y-2">
              {(weak.data ?? []).slice(0, 3).map((w) => (
                <li key={w.topic} className="font-medium">
                  {w.dot} {w.topic} <span className="text-slate-400 text-sm">({w.wrong} de {w.of} erradas)</span>
                </li>
              ))}
            </ul>
            <Btn to="/revisao">Revisar agora</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

export function Subjects() {
  const subjects = useSubjects();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Minhas matérias</h1>
        <Btn to="/materias/nova">
          <Plus size={18} />
          Nova matéria
        </Btn>
      </div>
      {subjects.loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : subjects.error ? (
        <ErrorState message={subjects.error} onRetry={subjects.reload} />
      ) : (subjects.data ?? []).length === 0 ? (
        <EmptyState
          icon="📚"
          title="Nenhuma matéria ainda"
          desc="Crie uma matéria e envie seus materiais para começar."
          action={<Btn to="/materias/nova">Nova matéria</Btn>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(subjects.data ?? []).map((s) => (
            <SubjectCard key={s.id} s={s} manage onChanged={subjects.reload} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SubjectPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sumBusy, setSumBusy] = useState(false);
  const [sumErr, setSumErr] = useState<string | null>(null);

  const data = useAsync(async () => {
    if (!id) return null;
    const [subject, questions, materials, stats, topics] = await Promise.all([
      getSubject(id),
      countQuestions(id),
      listMaterials(id),
      userId ? getSubjectStats(userId, id) : Promise.resolve(null),
      userId ? statsApi.topicPerformance(userId, id) : Promise.resolve([]),
    ]);
    return { subject, questions, materials, stats, topics };
  }, [id, userId]);

  const generate = async () => {
    if (!id) return;
    setGenerating(true);
    setGenMsg(null);
    setGenStart(Date.now());
    try {
      const res = await generateQuestions(id);
      setGenMsg(`Pronto! ${res.inserted} questões geradas.`);
      data.reload();
    } catch (e) {
      setGenMsg(`Erro: ${(e as Error).message}`);
    } finally {
      setGenerating(false);
      setGenStart(null);
    }
  };

  const doSummary = async () => {
    if (!id) return;
    setSumBusy(true);
    setSumErr(null);
    try {
      setSummary(await summarizeSubject(id));
    } catch (e) {
      setSumErr((e as Error).message);
    } finally {
      setSumBusy(false);
    }
  };

  if (data.loading) return <Spinner label="Carregando matéria…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title="Matéria não encontrada" action={<Btn to="/materias">Voltar</Btn>} />;

  const { subject, questions, materials, stats, topics } = data.data;
  const status = (m: Material) =>
    m.status === 'ready'
      ? { text: '✓ Pronto', cls: 'text-emerald-600' }
      : m.status === 'error'
        ? { text: 'Erro', cls: 'text-red-500' }
        : m.status === 'generating'
          ? { text: 'Gerando…', cls: 'text-amber-600' }
          : m.status === 'extracted'
            ? { text: 'Texto lido', cls: 'text-slate-500' }
            : { text: 'Enviado', cls: 'text-slate-500' };

  return (
    <div className="space-y-6">
      <div>
        <span className={`rounded-xl px-3 py-1 text-sm font-bold ${subject.tone ?? 'bg-slate-100 text-slate-700'}`}>
          {subject.name}
        </span>
        <h1 className="text-3xl font-extrabold mt-3">{subject.topic || subject.name}</h1>
        <p className="text-slate-600">
          {questions} questões · {stats?.answered ?? 0} respondidas · {stats?.streak ?? 0} dias de atividade
        </p>
      </div>

      <Card>
        <div className="flex justify-between font-bold">
          <span>Domínio</span>
          <span>{stats?.accuracy ?? 0}%</span>
        </div>
        <div className="mt-2">
          <Bar v={stats?.progress ?? 0} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn to={`/sessao/configurar/${subject.id}`} disabled={questions === 0}>
            Estudar agora
          </Btn>
          <Btn v="s" to={`/materias/nova?subject=${subject.id}`} disabled={materials.length >= 3}>
            Adicionar material
          </Btn>
          <Btn v="s" onClick={generate} disabled={generating || materials.length === 0}>
            <Sparkles size={16} />
            {generating ? 'Gerando…' : 'Gerar mais questões'}
          </Btn>
          <Btn v="s" onClick={doSummary} disabled={sumBusy || materials.length === 0}>
            <Sparkles size={16} />
            {sumBusy ? 'Resumindo…' : 'Resumo com IA'}
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/flashcards`} disabled={questions === 0}>
            <Layers size={16} />
            Flashcards
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/imprimir`} disabled={questions === 0}>
            <Printer size={16} />
            Imprimir
          </Btn>
          <Btn
            v="s"
            onClick={() =>
              shareText(
                `Estou estudando ${subject.topic || subject.name} no OmniLearn! ${questions} questões e ${stats?.accuracy ?? 0}% de acerto. 📚`,
              )
            }
          >
            <Share2 size={16} />
            Compartilhar
          </Btn>
        </div>
        {genMsg && !generating && <p className="text-sm mt-3 font-medium text-slate-600">{genMsg}</p>}
      </Card>

      {generating && genStart !== null && (
        <Generating label="Gerando questões com a IA…" startedAt={genStart} />
      )}

      {(summary || sumBusy || sumErr) && (
        <Card className="bg-indigo-50 border-indigo-100">
          <h2 className="font-bold mb-2">✨ Resumo da IA</h2>
          {sumBusy && <p className="text-sm text-slate-600">Lendo seus materiais e resumindo…</p>}
          {sumErr && <p className="text-sm text-red-600">{sumErr}</p>}
          {summary && <p className="text-sm text-slate-700 whitespace-pre-line">{summary}</p>}
        </Card>
      )}

      <Card>
        <h2 className="font-bold mb-3">Materiais</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum material enviado ainda.</p>
        ) : (
          <div className="space-y-3">
            {materials.map((m) => {
              const st = status(m);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <FileText className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.file_name}</p>
                    <p className="text-sm text-slate-500">{m.pages || '—'} páginas</p>
                    {m.status === 'error' && m.error_message && <p className="text-xs text-red-500">{m.error_message}</p>}
                  </div>
                  <span className={`ml-auto text-sm font-semibold shrink-0 ${st.cls}`}>{st.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {topics.length > 0 && (
        <Card>
          <h2 className="font-bold mb-3">Desempenho por assunto</h2>
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{t.topic}</span>
                  <span>{t.pct}%</span>
                </div>
                <Bar v={t.pct} color={t.pct >= 85 ? 'bg-emerald-500' : t.pct >= 70 ? 'bg-amber-500' : 'bg-red-400'} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

interface Entry {
  name: string;
  status: 'pending' | 'uploading' | 'reading' | 'ready' | 'error';
  msg?: string;
}

export function NewSubject() {
  const [params] = useSearchParams();
  const existingId = params.get('subject');
  const nav2 = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;

  const existing = useAsync(() => (existingId ? getSubject(existingId) : Promise.resolve(null)), [existingId]);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [pasted, setPasted] = useState('');

  const subjectId = existingId ?? created;

  const add = (list: FileList | null) => {
    if (!list) return;
    const valid: File[] = [];
    const errs: string[] = [];
    for (const f of Array.from(list)) {
      if (!/\.(pdf|pptx)$/i.test(f.name)) {
        errs.push(`${f.name}: só aceitamos PDF e PPTX`);
        continue;
      }
      if (f.size > 20 * 1024 * 1024) {
        errs.push(`${f.name}: maior que 20 MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 3));
    if (errs.length) setStatus(errs.join(' · '));
    else setStatus('');
  };

  const updateEntry = (i: number, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const run = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setStatus('');
    let sid = subjectId;
    try {
      if (!sid) {
        if (!name.trim()) throw new Error('Dê um nome para a matéria.');
        setStatus('Criando matéria…');
        const s = await createSubject(userId, name.trim(), topic.trim() || null);
        sid = s.id;
        setCreated(s.id);
      }
      if (!sid) throw new Error('Não foi possível criar a matéria.');
      const already = await countMaterials(sid);
      const incoming = mode === 'text' ? 1 : files.length;
      if (already + incoming > 3) throw new Error('Cada matéria aceita no máximo 3 materiais.');
      if (incoming === 0 && already === 0) throw new Error('Envie um arquivo ou cole um texto.');

      if (mode === 'text') {
        if (pasted.trim().length < 200) throw new Error('Cole um texto maior (pelo menos 200 caracteres).');
        setStatus('Salvando o texto…');
        await createTextMaterial(userId, sid, pasted.trim(), name.trim() || 'Texto colado');
      } else {
        setEntries(files.map((f) => ({ name: f.name, status: 'pending' })));
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          updateEntry(i, { status: 'uploading' });
          const mat = await uploadMaterial(userId, sid, file);
          updateEntry(i, { status: 'reading' });
          try {
            const ex = await extractText(file);
            if (ex.empty) {
              await setMaterialError(mat.id, 'Não conseguimos ler texto suficiente neste arquivo (pode ser escaneado ou só com imagens).');
              updateEntry(i, { status: 'error', msg: 'Sem texto legível' });
            } else {
              await setMaterialExtracted(mat.id, ex.pages, ex.text);
              updateEntry(i, { status: 'ready' });
            }
          } catch (err) {
            await setMaterialError(mat.id, (err as Error).message);
            updateEntry(i, { status: 'error', msg: (err as Error).message });
          }
        }
      }

      setStatus('Gerando questões com a IA…');
      setGenStart(Date.now());
      const res = await generateQuestions(sid);
      setStatus(`Tudo pronto! ${res.inserted} questões geradas.`);
      nav2(`/sessao/configurar/${sid}`);
    } catch (e) {
      setGenStart(null);
      setBusy(false);
      setStatus(`Erro: ${(e as Error).message}`);
    }
  };

  if (existingId && existing.loading) return <Spinner label="Carregando matéria…" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">
        {existingId ? `Adicionar material a ${existing.data?.name ?? ''}` : 'Crie uma nova matéria'}
      </h1>

      {!existingId && (
        <>
          <label className="block">
            <span className="font-semibold">Nome da matéria</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="História — Revolução Francesa"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
          <label className="block">
            <span className="font-semibold">Assunto (opcional)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Revolução Francesa"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
        </>
      )}

      <h2 className="font-bold text-lg">Adicione seu material</h2>
      <div className="flex gap-2">
        {(['file', 'text'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-2xl px-4 py-3 font-semibold border-2 ${mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            {m === 'file' ? '📎 Enviar arquivo' : '✍️ Colar texto'}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            add(e.dataTransfer.files);
          }}
          className="block cursor-pointer rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center hover:bg-indigo-50 focus-within:outline-2"
        >
          <Upload className="mx-auto text-indigo-600" size={32} />
          <p className="font-bold mt-3">Arraste seus arquivos aqui</p>
          <p className="text-sm text-slate-500">ou clique para selecionar</p>
          <p className="text-xs text-slate-400 mt-2">Até 3 arquivos · PDF ou PPTX · até 20 MB cada</p>
          <input type="file" multiple accept=".pdf,.pptx" className="sr-only" onChange={(e) => add(e.target.files)} />
        </label>
      ) : (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          placeholder="Cole aqui o texto do seu material (resumo, anotação, capítulo…)."
          className="w-full rounded-3xl border-2 border-slate-200 px-4 py-4 bg-white"
        />
      )}

      <p className="text-xs text-slate-500">
        O conteúdo enviado é processado por IA (Google Gemini) para gerar as questões e não deve conter dados pessoais de
        terceiros.
      </p>

      {entries.map((e, i) => (
        <Card key={i} className="flex items-center gap-3 pop">
          <FileText className="text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{e.name}</p>
            {e.msg && <p className="text-sm text-red-500">{e.msg}</p>}
          </div>
          <span
            className={`ml-auto text-sm font-semibold shrink-0 ${e.status === 'ready' ? 'text-emerald-600' : e.status === 'error' ? 'text-red-500' : 'text-slate-500'}`}
          >
            {e.status === 'pending' && 'Na fila'}
            {e.status === 'uploading' && 'Enviando…'}
            {e.status === 'reading' && 'Lendo…'}
            {e.status === 'ready' && '✓ Pronto'}
            {e.status === 'error' && '✕ Erro'}
          </span>
        </Card>
      ))}

      {genStart !== null ? (
        <Generating label="Gerando questões com a IA…" startedAt={genStart} />
      ) : (
        status && <p className="text-sm font-medium text-slate-600">{status}</p>
      )}

      <Btn disabled={(mode === 'text' ? pasted.trim().length < 200 : files.length === 0) || busy} onClick={run}>
        <Sparkles size={18} />
        {busy ? 'Processando…' : existingId ? 'Adicionar e gerar questões' : 'Criar minha sessão'}
      </Btn>
      {!busy && status.startsWith('Erro') && subjectId && (
        <Btn v="s" to={`/materias/${subjectId}`}>
          Ir para a matéria e tentar de novo
        </Btn>
      )}
    </div>
  );
}

export function Configure() {
  const { subjectId } = useParams();
  const nav2 = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [exam, setExam] = useState(false);
  const data = useAsync(async () => {
    if (!subjectId) return null;
    const [subject, questions] = await Promise.all([getSubject(subjectId), countQuestions(subjectId)]);
    return { subject, questions };
  }, [subjectId]);

  const planned = Math.min(18, data.data?.questions ?? 0);

  const start = async () => {
    if (!subjectId || !planned || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const id = await startSession({ subjectId, mode: 'smart', planned });
      nav2(`/sessao/${id}${exam ? '?exam=1' : ''}`);
    } catch (e) {
      setMsg(`Erro: ${(e as Error).message}`);
      setBusy(false);
    }
  };

  if (data.loading) return <Spinner label="Preparando…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title="Matéria não encontrada" action={<Btn to="/materias">Voltar</Btn>} />;

  const { subject, questions } = data.data;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-extrabold">Prepare sua sessão</h1>
      <Card className="divide-y divide-slate-100">
        {[
          ['Matéria', subject.name],
          ['Conteúdo', subject.topic || subject.name],
          ['Tempo', '15 minutos'],
          ['Quantidade estimada', questions ? `${planned} questões` : 'Nenhuma questão ainda'],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between py-3">
            <span className="text-slate-500">{a}</span>
            <span className="font-semibold text-right">{b}</span>
          </div>
        ))}
      </Card>
      <Card className="bg-indigo-50 border-indigo-100">
        <p className="font-bold">Aprendizado inteligente</p>
        <p className="text-sm text-slate-600">As perguntas serão adaptadas ao seu desempenho.</p>
      </Card>
      <Card>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exam}
            onChange={(e) => setExam(e.target.checked)}
            className="mt-1 w-5 h-5 accent-indigo-600"
          />
          <div>
            <p className="font-bold">🎓 Modo prova</p>
            <p className="text-sm text-slate-600">No modo prova você responde sem ver se acertou, como uma prova de verdade. O resultado aparece só no final.</p>
          </div>
        </label>
      </Card>
      {questions === 0 && (
        <p className="text-sm text-amber-700">
          Esta matéria ainda não tem questões. Adicione material e gere as questões primeiro.
        </p>
      )}
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <Btn disabled={planned === 0 || busy} onClick={start}>
        {busy ? 'Começando…' : 'Começar sessão'}
      </Btn>
    </div>
  );
}

export function Result() {
  const { sessionId } = useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const data = useAsync(async () => {
    if (!sessionId) return null;
    const sess = await getSession(sessionId);
    const [topics, profile, week, achievements] = await Promise.all([
      sessionTopicBreakdown(sessionId),
      userId ? getProfile(userId) : Promise.resolve(null),
      userId ? statsApi.studiedDates(userId, 7) : Promise.resolve<string[]>([]),
      userId && sess ? newlyUnlocked(userId, sess.started_at) : Promise.resolve([]),
    ]);
    return { sess, topics, profile, week, achievements };
  }, [sessionId, userId]);

  if (data.loading) return <Spinner label="Carregando resultado…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.sess) return <EmptyState title="Resultado não encontrado" action={<Btn to="/dashboard">Voltar</Btn>} />;

  const { sess, topics, profile, week, achievements } = data.data;
  const pct = sess.total ? Math.round((sess.correct / sess.total) * 100) : 0;
  const good = topics.filter((t) => t.correct > 0).sort((a, b) => b.correct - a.correct);
  const bad = topics.filter((t) => t.wrong > 0).sort((a, b) => b.wrong - a.wrong);

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="text-6xl pop">🎉</div>
      <h1 className="text-3xl font-extrabold">Sessão concluída!</h1>
      <p className="text-slate-600">Você completou sua sessão de hoje.</p>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-2xl font-extrabold">
            {sess.correct} / {sess.total}
          </p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold">{pct}%</p>
          <p className="text-xs text-slate-500">de acerto</p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold text-amber-500">+{sess.xp_gained} XP</p>
        </Card>
      </div>
      <Card className="text-left">
        <p className="font-bold text-orange-600 mb-3">
          {profile && profile.streak > 0 ? `Sua sequência continua! 🔥 ${profile.streak} ${profile.streak === 1 ? 'dia' : 'dias'}` : 'Comece sua sequência! 🔥'}
        </p>
        <Week dates={week} />
      </Card>
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        <Card>
          <h2 className="font-bold">Você mandou bem em:</h2>
          {good.length ? good.slice(0, 4).map((t) => <p key={t.topic} className="mt-2">🟢 {t.topic}</p>) : <p className="text-sm text-slate-500 mt-2">—</p>}
        </Card>
        <Card>
          <h2 className="font-bold">Vale revisar:</h2>
          {bad.length ? bad.slice(0, 4).map((t) => <p key={t.topic} className="mt-2">🔴 {t.topic}</p>) : <p className="text-sm text-slate-500 mt-2">Nada para revisar. 👏</p>}
        </Card>
      </div>
      {achievements.length > 0 && (
        <Card className="text-left">
          <h2 className="font-bold mb-2">Novas conquistas</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 font-semibold pop">
                {a.icon} {a.title}
              </span>
            ))}
          </div>
        </Card>
      )}
      <div className="flex gap-3 justify-center">
        <Btn to="/revisao">Revisar meus erros</Btn>
        <Btn v="s" to="/dashboard">
          Voltar ao início
        </Btn>
      </div>
    </div>
  );
}

export function Review() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const nav2 = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const weak = useAsync(() => (userId ? statsApi.weakSpots(userId) : Promise.resolve([])), [userId]);

  const practice = async (topic: string, subjectId: string) => {
    if (!subjectId) {
      setMsg('Não foi possível abrir a prática deste assunto.');
      return;
    }
    setBusy(topic);
    setMsg(null);
    try {
      const id = await startSession({ subjectId, mode: 'topic', topicFilter: topic, planned: 18 });
      nav2(`/sessao/${id}`);
    } catch (e) {
      setMsg(`Erro: ${(e as Error).message}`);
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Vamos reforçar seus pontos fracos.</h1>
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      {weak.loading ? (
        <Skeleton className="h-28" />
      ) : weak.error ? (
        <ErrorState message={weak.error} onRetry={weak.reload} />
      ) : (weak.data ?? []).length === 0 ? (
        <EmptyState icon="🎉" title="Nenhum erro recente!" desc="Continue praticando para manter o ritmo." action={<Btn to="/dashboard">Voltar</Btn>} />
      ) : (
        (weak.data ?? []).map((w) => (
          <Card key={w.topic} className="flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <h2 className="font-bold text-lg">{w.topic}</h2>
              <p className="text-slate-600 text-sm">
                Você errou {w.wrong} de {w.of} questões.
              </p>
              <p className="text-sm font-semibold mt-1">
                {w.dot} Nível: {w.level}
              </p>
            </div>
            <Btn onClick={() => practice(w.topic, w.subject_id)} disabled={busy === w.topic}>
              {busy === w.topic ? 'Abrindo…' : 'Praticar'}
            </Btn>
          </Card>
        ))
      )}
    </div>
  );
}

export function Stats() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const data = useAsync(async () => {
    if (!userId) return null;
    const [profile, answered, acc, week, masteryVal, subjectList, perfs, weak] = await Promise.all([
      getProfile(userId),
      statsApi.answeredCount(userId),
      statsApi.accuracy(userId),
      statsApi.weeklyAccuracy(userId),
      statsApi.mastery(userId),
      listSubjects(userId),
      statsApi.subjectPerformance(userId),
      statsApi.weakSpots(userId),
    ]);
    return { profile, answered, acc, week, masteryVal, subjectList, perfs, weak };
  }, [userId]);

  if (data.loading) return <Spinner label="Carregando estatísticas…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  const { profile, answered, acc, week, masteryVal, subjectList, perfs, weak } = data.data;
  const perfOf = (sid: string) => perfs.find((p) => p.subject_id === sid)?.pct ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Sua evolução</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['🔥', `${profile?.streak ?? 0} dias de sequência`],
          ['🏆', `${profile?.xp ?? 0} XP`],
          ['📚', `${answered} questões respondidas`],
          ['🎯', `${acc}% de aproveitamento`],
        ].map(([e, t]) => (
          <Card key={t}>
            <div className="text-2xl">{e}</div>
            <p className="font-bold mt-1">{t}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold mb-4">Evolução semanal</h2>
          <div className="flex items-end gap-2 h-40">
            {week.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs font-semibold">{d.count ? `${d.pct}%` : ''}</span>
                <div className="w-full rounded-t-xl bg-indigo-500 transition-all" style={{ height: `${Math.max(d.pct, 3)}%` }} />
                <span className="text-xs text-slate-500 mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col items-center text-center gap-3">
          <h2 className="font-bold">Domínio estimado do conteúdo</h2>
          {masteryVal === null ? (
            <div className="grid place-items-center h-[150px] text-slate-500 font-semibold">Ainda coletando dados</div>
          ) : (
            <Ring v={masteryVal} />
          )}
          <p className="text-xs text-slate-500">
            Este índice é baseado no seu desempenho recente, acertos, erros, dificuldade das questões e consistência dos
            estudos. Ele não representa uma probabilidade real de aprovação.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-bold mb-3">Desempenho por matéria</h2>
        {subjectList.length === 0 ? (
          <p className="text-sm text-slate-500">Sem dados ainda.</p>
        ) : (
          <div className="space-y-3">
            {subjectList.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{s.name}</span>
                  <span>{perfOf(s.id)}%</span>
                </div>
                <Bar v={perfOf(s.id)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold">Continue praticando</h2>
          {weak.length ? (
            weak.slice(0, 4).map((w) => (
              <p key={w.topic} className="mt-2">
                {w.dot} {w.topic}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500 mt-2">Nada aqui. 👏</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export function Achievements() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const data = useAsync(() => (userId ? listAchievements(userId) : Promise.resolve([])), [userId]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">Conquistas</h1>
      {data.loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={data.reload} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(data.data ?? []).map((a) => (
            <Card key={a.id} className={`flex gap-4 items-center ${a.unlocked ? '' : 'opacity-50 grayscale'}`}>
              <span className="text-4xl">{a.icon}</span>
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-sm text-slate-600">{a.descr}</p>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {a.unlocked ? (
                    `✓ Desbloqueada${a.unlocked_at ? ` em ${formatDate(a.unlocked_at)}` : ''}`
                  ) : (
                    <>
                      <Lock size={12} />
                      Bloqueada
                    </>
                  )}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile();
  const { theme, sound, reminder, toggleTheme, toggleSound, toggleReminder } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const extra = useAsync(async () => {
    if (!userId) return null;
    const [answered, acc, subjects] = await Promise.all([
      statsApi.answeredCount(userId),
      statsApi.accuracy(userId),
      listSubjects(userId),
    ]);
    return { answered, acc, subjects: subjects.length };
  }, [userId]);

  const p = profile.data;
  const displayName = p?.name ?? 'Estudante';
  const xp = p?.xp ?? 0;

  const startEdit = () => {
    setName(displayName);
    setEditing(true);
  };
  const saveName = async () => {
    if (!userId || !name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await updateProfileName(userId, name.trim());
      setEditing(false);
      profile.reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const pickPhoto = async (file: File | undefined) => {
    if (!file || !userId) return;
    if (!/^image\//.test(file.type)) {
      setMsg('Escolha um arquivo de imagem (JPG, PNG…).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg('A foto deve ter no máximo 5 MB.');
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      await uploadAvatar(userId, file);
      await profile.reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  };
  const saveGoal = async () => {
    if (!userId) return;
    const n = parseInt(goalInput, 10);
    if (!n || n < 5 || n > 100) {
      setMsg('Escolha uma meta entre 5 e 100 questões.');
      return;
    }
    setSavingGoal(true);
    setMsg(null);
    try {
      await updateDailyGoal(userId, n);
      await profile.reload();
      setGoalInput('');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSavingGoal(false);
    }
  };
  const removeAccount = async () => {
    if (!confirm('Excluir sua conta e TODOS os seus dados? Esta ação não pode ser desfeita.')) return;
    if (!confirm('Tem certeza absoluta? Materiais, questões e histórico serão apagados.')) return;
    setBusy(true);
    setMsg(null);
    try {
      await deleteAccount();
      await signOut();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-extrabold">Meu perfil</h1>
      <Card className="text-center">
        <div className="relative w-24 h-24 mx-auto grid place-items-center">
          <Avatar name={displayName} src={profile.data?.avatar_url} size={96} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Trocar foto"
            className="absolute -bottom-1 -right-1 grid place-items-center w-9 h-9 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-40"
          >
            <Camera size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </div>
        {uploading && <p className="text-xs text-slate-500 mt-2">Enviando foto…</p>}
        {editing ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2"
              autoFocus
            />
            <Btn onClick={saveName} disabled={busy}>
              Salvar
            </Btn>
          </div>
        ) : (
          <h2 className="text-xl font-bold mt-3">{displayName}</h2>
        )}
        <p className="text-slate-600">Nível {p?.level ?? 1}</p>
        <div className="mt-3">
          <Bar v={(xpInLevel(xp) / XP_PER_LEVEL) * 100} color="bg-amber-400" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          XP: {xpInLevel(xp)} / {XP_PER_LEVEL}
        </p>
        <p className="mt-2 font-semibold">🔥 Sequência: {p?.streak ?? 0} dias</p>
      </Card>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [extra.data?.answered ?? 0, 'questões'],
          [`${extra.data?.acc ?? 0}%`, 'acerto'],
          [extra.data?.subjects ?? 0, 'matérias'],
        ].map(([v, l]) => (
          <Card key={l}>
            <p className="text-xl font-extrabold">{v}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-bold mb-1">Preferências</h2>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium">Tema escuro</p>
            <p className="text-sm text-slate-500">Melhor para estudar à noite.</p>
          </div>
          <Switch on={theme === 'dark'} onChange={toggleTheme} label="Tema escuro" />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">Sons ao responder</p>
            <p className="text-sm text-slate-500">Um "plim" no acerto e um "tadam" no erro.</p>
          </div>
          <Switch on={sound} onChange={toggleSound} label="Sons ao responder" />
        </div>
        <div className="py-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Meta diária de questões</p>
              <p className="text-sm text-slate-500">Quantas questões você quer resolver por dia?</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={5}
                max={100}
                value={goalInput || String(p?.daily_goal ?? 18)}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center"
              />
              <Btn v="s" onClick={saveGoal} disabled={savingGoal}>
                {savingGoal ? '…' : 'Salvar'}
              </Btn>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">Lembrete diário</p>
            <p className="text-sm text-slate-500">Aviso às 19h se você ainda não bateu a meta.</p>
          </div>
          <Switch on={reminder} onChange={() => void toggleReminder()} label="Lembrete diário" />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">Diretrizes e termos</p>
            <p className="text-sm text-slate-500">Regras de uso, IA e privacidade.</p>
          </div>
          <Link to="/diretrizes" className="text-sm font-semibold text-indigo-600 shrink-0">
            Abrir
          </Link>
        </div>
      </Card>

      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {!editing && <Btn v="s" onClick={startEdit}>Editar perfil</Btn>}
        <Btn
          v="s"
          onClick={() =>
            shareText(
              `Estou usando o OmniLearn! 🔥 Sequência de ${p?.streak ?? 0} dias, nível ${p?.level ?? 1} e ${extra.data?.answered ?? 0} questões respondidas. 📚`,
            )
          }
        >
          <Share2 size={16} /> Compartilhar progresso
        </Btn>
        <Btn v="s" onClick={removeAccount} disabled={busy}>
          <Trash2 size={16} /> Excluir minha conta e meus dados
        </Btn>
      </div>
    </div>
  );
}

export function Flashcards() {
  const { id } = useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<{ box: number; xp_gained: number } | null>(null);
  const [grading, setGrading] = useState(false);
  const data = useAsync(() => (userId ? reviewQueue(userId, 20, id) : Promise.resolve<Flashcard[]>([])), [userId, id]);
  const cards = data.data ?? [];
  const card = cards[idx];

  const grade = async (correct: boolean) => {
    if (!card || grading) return;
    setGrading(true);
    try {
      setResult(await gradeFlashcard(card.question.id, correct));
    } catch {
      setResult({ box: card.box, xp_gained: 0 });
    } finally {
      setGrading(false);
    }
  };
  const next = () => {
    setShow(false);
    setResult(null);
    setIdx((i) => i + 1);
  };

  if (data.loading) return <Spinner label="Carregando flashcards…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  if (!card) {
    return (
      <div className="max-w-xl">
        <EmptyState
          icon="🃏"
          title={cards.length === 0 ? 'Nenhum flashcard por aqui ainda' : 'Você revisou todos os flashcards de hoje!'}
          desc={cards.length === 0 ? 'Resolva sessões para os flashcards aparecerem.' : 'Volte amanhã para revisar de novo. 🎉'}
          action={<Btn to="/dashboard">Voltar ao início</Btn>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🃏 Flashcards</h1>
        <span className="text-sm font-semibold text-slate-500">
          {idx + 1} de {cards.length}
        </span>
      </div>
      <Bar v={((idx + 1) / cards.length) * 100} />

      <Card className="min-h-[220px] flex flex-col justify-center text-center">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{card.question.topic}</p>
        <h2 className="text-2xl font-extrabold mt-3">{card.question.prompt}</h2>
        {card.question.options && card.question.options.length > 0 && (
          <ul className="mt-4 space-y-1 text-slate-600">
            {card.question.options.map((o) => (
              <li key={o}>• {o}</li>
            ))}
          </ul>
        )}
        {show && (
          <div className="mt-5 fade">
            <p className="text-sm font-bold text-emerald-600">Resposta</p>
            <p className="text-lg font-semibold">
              {card.question.type === 'match'
                ? (card.question.pairs ?? []).map((p) => p.join(' → ')).join(' · ')
                : card.question.answer}
            </p>
            {card.question.explanation && <p className="text-sm text-slate-600 mt-2">{card.question.explanation}</p>}
          </div>
        )}
      </Card>

      {!show && !result && (
        <Btn className="w-full" onClick={() => setShow(true)}>
          Mostrar resposta
        </Btn>
      )}

      {show && !result && (
        <div className="flex gap-3">
          <Btn v="s" className="flex-1" onClick={() => grade(false)} disabled={grading}>
            😅 Errei
          </Btn>
          <Btn className="flex-1" onClick={() => grade(true)} disabled={grading}>
            😎 Acertei
          </Btn>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-slate-600">
            {result.xp_gained > 0 ? `+${result.xp_gained} XP · ` : ''}caixa {result.box} de 5
          </p>
          <Btn className="w-full" onClick={next}>
            {idx + 1 < cards.length ? 'Próximo' : 'Concluir'}
          </Btn>
        </div>
      )}
    </div>
  );
}

export function PrintSubject() {
  const { id } = useParams();
  const data = useAsync(async () => {
    if (!id) return null;
    const [subject, questions] = await Promise.all([getSubject(id), listQuestions(id)]);
    return { subject, questions };
  }, [id]);

  if (data.loading) return <Spinner label="Preparando impressão…" />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title="Matéria não encontrada" action={<Btn to="/materias">Voltar</Btn>} />;

  const { subject, questions } = data.data;

  return (
    <div className="max-w-3xl mx-auto p-6 text-slate-900">
      <div className="flex items-center justify-between mb-6 no-print">
        <Btn to={`/materias/${subject.id}`} v="s">
          Voltar
        </Btn>
        <Btn onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / salvar PDF
        </Btn>
      </div>
      <h1 className="text-2xl font-extrabold">{subject.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {subject.topic || ''} · {questions.length} questões
      </p>

      <ol className="space-y-6">
        {questions.map((q, i) => (
          <li key={q.id} className="break-inside-avoid">
            <p className="font-semibold">
              {i + 1}. {q.prompt}
            </p>
            {q.type === 'multiple' && q.options && (
              <ul className="mt-2 ml-4 space-y-1">
                {q.options.map((o, k) => (
                  <li key={o}>
                    {'ABCD'.charAt(k)}) {o}
                  </li>
                ))}
              </ul>
            )}
            {q.type === 'match' && q.pairs && (
              <ul className="mt-2 ml-4 space-y-1">
                {q.pairs.map(([a, b]) => (
                  <li key={a}>
                    {a} → ____________ ({b})
                  </li>
                ))}
              </ul>
            )}
            {q.type === 'short' && <div className="mt-2 ml-4">Resposta: ______________________________</div>}
          </li>
        ))}
      </ol>

      <h2 className="text-xl font-extrabold mt-10 mb-3">Gabarito</h2>
      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li key={q.id}>
            {i + 1}. {q.type === 'match' ? (q.pairs ?? []).map((p) => p.join(' → ')).join(' · ') : q.answer}
          </li>
        ))}
      </ol>
    </div>
  );
}
