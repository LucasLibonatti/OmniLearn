import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
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
  LifeBuoy,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Avatar, Btn, Card, Bar, Ring, Logo } from './ui';
import { EmojiIcon, Icon, flameFor, type IconName } from './icons';
import { EmptyState, ErrorState, Generating, Skeleton, Spinner } from './components/states';
import { confirmDialog } from './components/confirm';
import { useAuth } from './auth';
import { useAsync } from './hooks/useAsync';
import { useSettings } from './hooks/useSettings';
import { useI18n, type Lang } from './i18n';
import { useProfile, useSubjects, useArchivedSubjects } from './hooks/useApp';
import {
  archiveSubject,
  createSubject,
  deleteSubject,
  getSubject,
  getSubjectStats,
  listSubjects,
  renameSubject,
  unarchiveSubject,
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
import { formatDate, greeting, lastNDates, shortAgo, todaySP, weekLabel } from './lib/dates';
import { xpInLevel, XP_PER_LEVEL } from './engine/xp';
import { extractPdf, extractPptx, extractText, inspectAndExtractFile, MAX_PDF_PAGES, MAX_PPTX_SLIDES } from './lib/extract';
import type { Material, SubjectWithStats } from './types';

const navItems = (tr: (s: string, vars?: any) => string) => [
  { to: '/dashboard', label: tr('Início'), icon: Home },
  { to: '/materias', label: tr('Minhas matérias'), icon: BookOpen },
  { to: '/flashcards', label: tr('Flashcards'), icon: Layers },
  { to: '/estatisticas', label: tr('Estatísticas'), icon: BarChart3 },
  { to: '/conquistas', label: tr('Conquistas'), icon: Trophy },
  { to: '/perfil', label: tr('Perfil'), icon: User },
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

export function Layout({ children }: { children?: ReactNode }) {
  const { tr } = useI18n();
  const { data: profile } = useProfile();
  const { session, signOut } = useAuth();
  const { theme, sound, reminder, toggleTheme, toggleSound } = useSettings();
  const loc = useLocation();
  const today = useAsync(() => (session?.user.id ? statsApi.answeredToday(session.user.id) : Promise.resolve(0)), [session?.user.id]);
  const name = profile?.name ?? tr('Estudante');
  const nav = navItems(tr);
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
      new Notification(tr('Hora de estudar! 📚'), {
        body: done > 0 ? tr('Você fez {n} de {goal} questões hoje. Bora manter a sequência?', { n: done, goal }) : tr('Você ainda não estudou hoje. Bora manter a sequência?'),
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
        <nav className="mt-8 flex flex-col gap-1" aria-label={tr('Principal')}>
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
            to="/suporte"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <LifeBuoy size={20} />
            {tr('Suporte')}
          </Link>
          <Link
            to="/redes"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <Share2 size={20} />
            {tr('Redes sociais')}
          </Link>
          <Link
            to="/diretrizes"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            <ScrollText size={20} />
            {tr('Diretrizes')}
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={name} src={profile?.avatar_url} size={40} />
            <div className="text-sm min-w-0">
              <p className="font-semibold truncate">{name}</p>
              <p className="text-slate-500">{tr('Nível {n}', { n: profile?.level ?? 1 })}</p>
            </div>
            <div className="ml-auto flex items-center">
              <button
                aria-label={theme === 'dark' ? tr('Usar tema claro') : tr('Usar tema escuro')}
                onClick={toggleTheme}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                aria-label={tr('Sair')}
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
        {children ?? <Outlet />}
      </main>
      <nav aria-label={tr('Mobile')} className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex justify-around py-2 z-10">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-[11px] gap-0.5 px-2 py-1 ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`
            }
          >
            <n.icon size={22} />
            {n.label.replace(tr('Minhas '), '')}
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
  archived = false,
  onChanged,
}: {
  s: SubjectWithStats;
  manage?: boolean;
  archived?: boolean;
  onChanged?: () => void;
}) {
  const { tr } = useI18n();
  const nav2 = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [busy, setBusy] = useState(false);
  const open = () => nav2(`/materias/${s.id}`);

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
    const ok = await confirmDialog({
      title: tr('Arquivar matéria'),
      message: tr('Tem certeza que deseja arquivar a matéria "{name}"?', { name: s.name }),
      note: tr('Você poderá recuperá-la depois em "Arquivadas".'),
      confirmLabel: tr('Arquivar'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      await archiveSubject(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };
  const unarchive = async () => {
    setBusy(true);
    try {
      await unarchiveSubject(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    const ok = await confirmDialog({
      title: tr('Excluir matéria'),
      message: tr('Tem certeza que deseja excluir a matéria "{name}"?', { name: s.name }),
      note: tr('Se você excluir, esta matéria será apagada para sempre, junto com as questões, materiais e arquivos enviados.'),
      confirmLabel: tr('Excluir'),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteSubject(s.id);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition cursor-pointer" onClick={open}>
      <div className="flex justify-between items-start gap-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-bold"
            autoFocus
          />
        ) : (
          <span className={`rounded-xl px-3 py-1 text-sm font-bold ${s.tone ?? 'bg-slate-100 text-slate-700'}`}>{s.name}</span>
        )}
        <span className="inline-flex items-center gap-1 text-sm text-orange-500 font-semibold">
          <Icon name={flameFor(s.streak)} size={16} /> {s.streak}
        </span>
      </div>
      <h3 className="font-bold text-lg mt-3">{s.topic || s.name}</h3>
      <p className="text-sm text-slate-500">
        {tr('{n} questões', { n: s.questions })} · {tr('Última sessão')}: {shortAgo(s.last_session)}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <Bar v={s.progress} />
        </div>
        <span className="text-sm font-bold">{s.progress}%</span>
      </div>
      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {archived ? (
          <>
            <Btn className="flex-1" onClick={unarchive} disabled={busy}>
              {tr('Reativar')}
            </Btn>
            <Btn v="s" onClick={remove} disabled={busy}>
              <Trash2 size={16} /> {tr('Excluir')}
            </Btn>
          </>
        ) : (
          <>
            <Btn className="flex-1" onClick={() => nav2(`/sessao/configurar/${s.id}`)} disabled={!s.questions}>
              {s.questions ? tr('Estudar') : tr('Sem questões')}
            </Btn>
            <Btn v="s" to={`/materias/${s.id}`}>
              {tr('Abrir')}
            </Btn>
          </>
        )}
      </div>
      {manage && !archived && (
        <div className="mt-2 flex justify-end items-center gap-1 text-slate-400" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <button onClick={save} disabled={busy} className="px-2 py-1 text-xs font-semibold text-indigo-600">
              {tr('Salvar')}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 hover:text-indigo-600" aria-label={tr('Renomear')}>
              <Pencil size={16} />
            </button>
          )}
          <button onClick={archive} disabled={busy} className="p-2 hover:text-slate-700" aria-label={tr('Arquivar')}>
            <Archive size={16} />
          </button>
          <button onClick={remove} disabled={busy} className="p-2 hover:text-red-600" aria-label={tr('Excluir')}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </Card>
  );
}

export function Dashboard() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const nav2 = useNavigate();
  const userId = session?.user.id;
  const { data: profile } = useProfile();
  const subjects = useSubjects();
  const today = useAsync(() => (userId ? statsApi.answeredToday(userId) : Promise.resolve(0)), [userId]);
  const week = useAsync(() => (userId ? statsApi.studiedDates(userId, 7) : Promise.resolve<string[]>([])), [userId]);
  const pending = useAsync(() => (userId ? pendingSession(userId) : Promise.resolve(null)), [userId]);
  const weak = useAsync(() => (userId ? statsApi.weakSpots(userId) : Promise.resolve([])), [userId]);

  const name = (profile?.name ?? tr('Estudante')).split(' ')[0];
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
        <p className="text-slate-600">{tr('Pronto para estudar hoje?')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <Icon name={flameFor(streak)} size={56} className="float" />
          <p className="text-4xl font-extrabold mt-2">{tr('{n} dias', { n: streak })}</p>
          <p className="text-slate-600">
            {streak === 0 ? tr('Comece sua sequência hoje!') : tr('Você está em uma sequência incrível!')}
          </p>
          <div className="mt-4">
            <Week dates={week.data ?? []} />
          </div>
        </Card>
        <Card className="md:col-span-2 flex flex-col">
          <p className="font-bold">{tr('Sessão de hoje')}</p>
          <p className="text-sm text-slate-500 mt-1">
            {tr('{done} / {goal} questões respondidas hoje', { done, goal })}
          </p>
          <div className="mt-3">
            <Bar v={Math.min(100, (done / goal) * 100)} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 mt-auto">
            <p className="text-sm text-slate-500">{breaking ? tr('Não deixe sua sequência quebrar!') : tr('Continue assim!')}</p>
            {pending.data ? (
              <Btn to={`/sessao/${pending.data.id}`}>{tr('Continuar sessão')}</Btn>
            ) : subjectsData.length ? (
              <Btn to={`/sessao/configurar/${subjectsData[0].id}`} disabled={!subjectsData[0].questions}>
                {tr('Começar sessão de hoje')}
              </Btn>
            ) : (
              <Btn onClick={() => nav2('/materias/nova')}>{tr('Criar minha primeira matéria')}</Btn>
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
          icon={<Icon name="livro" size={56} />}
          title={tr('Bem-vindo ao OmniLearn!')}
          desc={tr('Crie sua primeira matéria, envie seus slides e deixe a IA montar seus exercícios.')}
          action={<Btn onClick={() => nav2('/materias/nova')}>{tr('Criar minha primeira matéria')}</Btn>}
        />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {subjectsData.slice(0, 3).map((s) => (
            <SubjectCard key={s.id} s={s} />
          ))}
        </div>
      )}

        <Card>
          <h2 className="font-bold text-lg">{tr('Seus pontos de atenção')}</h2>
          {weak.loading ? (
            <Skeleton className="h-16 mt-3" />
          ) : (weak.data ?? []).length === 0 ? (
            <p className="text-slate-600 text-sm mt-2">{tr('Nenhum ponto fraco por aqui. Continue assim! 💪')}</p>
          ) : (
            <>
              <p className="text-slate-600 text-sm">{tr('Com base nas suas últimas respostas, recomendamos revisar:')}</p>
              <ul className="my-4 space-y-2">
                {(weak.data ?? []).slice(0, 3).map((w) => (
                  <li key={w.topic} className="font-medium">
                    {w.dot} {w.topic} <span className="text-slate-400 text-sm">{tr('({n} de {of} erradas)', { n: w.wrong, of: w.of })}</span>
                  </li>
                ))}
              </ul>
              <Btn to="/revisao">{tr('Revisar agora')}</Btn>
            </>
          )}
        </Card>
    </div>
  );
}

export function Subjects() {
  const { tr } = useI18n();
  const nav2 = useNavigate();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const subjects = useSubjects();
  const archived = useArchivedSubjects();
  const list = tab === 'active' ? subjects : archived;
  const data = list.data ?? [];
  const reloadAll = () => {
    subjects.reload();
    archived.reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">{tr('Minhas matérias')}</h1>
        <Btn onClick={() => nav2('/materias/nova')}>
          <Plus size={18} />
          {tr('Nova matéria')}
        </Btn>
      </div>

      <div
        role="tablist"
        aria-label={tr('Minhas matérias')}
        className="mb-6 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1"
      >
        {([
          ['active', tr('Ativas')],
          ['archived', tr('Arquivadas')],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Icon name="livro" size={56} />}
          title={tab === 'active' ? tr('Nenhuma matéria ainda') : tr('Nenhuma matéria arquivada')}
          desc={
            tab === 'active'
              ? tr('Crie uma matéria e envie seus materiais para começar.')
              : tr('Arquive uma matéria para vê-la aqui. Você pode reativá-la quando quiser.')
          }
          action={tab === 'active' ? <Btn onClick={() => nav2('/materias/nova')}>{tr('Nova matéria')}</Btn> : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((s) => (
            <SubjectCard
              key={s.id}
              s={s}
              manage={tab === 'active'}
              archived={tab === 'archived'}
              onChanged={reloadAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SubjectPage() {
  const { tr } = useI18n();
  const { id } = useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sumBusy, setSumBusy] = useState(false);
  const [sumErr, setSumErr] = useState<string | null>(null);
  const [sumStart, setSumStart] = useState<number | null>(null);

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
      setGenMsg(tr('Pronto! {n} questões geradas.', { n: res.inserted }));
      data.reload();
    } catch (e) {
      setGenMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
    } finally {
      setGenerating(false);
      setGenStart(null);
    }
  };

  const doSummary = async () => {
    if (!id) return;
    setSumBusy(true);
    setSumErr(null);
    setSummary(null);
    setSumStart(Date.now());
    try {
      setSummary(await summarizeSubject(id));
    } catch (e) {
      setSumErr((e as Error).message);
    } finally {
      setSumBusy(false);
      setSumStart(null);
    }
  };

  if (data.loading) return <Spinner label={tr('Carregando matéria…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;

  const { subject, questions, materials, stats, topics } = data.data;
  const status = (m: Material) =>
    m.status === 'ready'
      ? { text: tr('✓ Pronto'), cls: 'text-emerald-600' }
      : m.status === 'error'
        ? { text: tr('Erro'), cls: 'text-red-500' }
        : m.status === 'generating'
          ? { text: tr('Gerando…'), cls: 'text-amber-600' }
          : m.status === 'extracted'
            ? { text: tr('Texto lido'), cls: 'text-slate-500' }
            : { text: tr('Enviado'), cls: 'text-slate-500' };

  return (
    <div className="space-y-6">
      <div>
        <span className={`rounded-xl px-3 py-1 text-sm font-bold ${subject.tone ?? 'bg-slate-100 text-slate-700'}`}>
          {subject.name}
        </span>
        <h1 className="text-3xl font-extrabold mt-3">{subject.topic || subject.name}</h1>
        <p className="text-slate-600">
          {tr('{n} questões', { n: questions })} · {tr('{n} respondidas', { n: stats?.answered ?? 0 })} · {tr('{n} dias de atividade', { n: stats?.streak ?? 0 })}
        </p>
      </div>

      <Card>
        <div className="flex justify-between font-bold">
          <span>{tr('Domínio')}</span>
          <span>{stats?.accuracy ?? 0}%</span>
        </div>
        <div className="mt-2">
          <Bar v={stats?.progress ?? 0} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn to={`/sessao/configurar/${subject.id}`} disabled={questions === 0}>
            {tr('Estudar agora')}
          </Btn>
          <Btn v="s" to={`/materias/nova?subject=${subject.id}`} disabled={materials.length >= 1}>
            {tr('Adicionar material')}
          </Btn>
          <Btn v="s" onClick={generate} disabled={generating || sumBusy || materials.length === 0}>
            <Sparkles size={16} />
            {generating ? tr('Gerando…') : tr('Gerar mais questões')}
          </Btn>
          <Btn v="s" onClick={doSummary} disabled={sumBusy || generating || materials.length === 0}>
            <Sparkles size={16} />
            {sumBusy ? tr('Resumindo…') : tr('Resumo com IA')}
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/flashcards`} disabled={questions === 0}>
            <Layers size={16} />
            {tr('Flashcards')}
          </Btn>
          <Btn v="s" to={`/materias/${subject.id}/imprimir`} disabled={questions === 0}>
            <Printer size={16} />
            {tr('Imprimir')}
          </Btn>
          <Btn
            v="s"
            onClick={() =>
              shareText(
                tr('Estou estudando {topic} no OmniLearn! {n} questões e {pct}% de acerto. 📚', {
                  topic: subject.topic || subject.name,
                  n: questions,
                  pct: stats?.accuracy ?? 0,
                }),
              )
            }
          >
            <Share2 size={16} />
            {tr('Compartilhar')}
          </Btn>
        </div>
        {genMsg && !generating && <p className="text-sm mt-3 font-medium text-slate-600">{genMsg}</p>}
      </Card>

      {generating && genStart !== null && (
        <Generating label={tr('Gerando questões com a IA…')} startedAt={genStart} />
      )}

      {sumBusy && sumStart !== null && (
        <Generating label={tr('Resumindo seus materiais com a IA…')} startedAt={sumStart} />
      )}

      {(summary || sumErr) && !sumBusy && (
        <Card className="bg-indigo-50 border-indigo-100">
          <h2 className="font-bold mb-2 inline-flex items-center gap-2">
            <Icon name="estrela" size={22} /> {tr('Resumo da IA')}
          </h2>
          {sumErr && <p className="text-sm text-red-600">{sumErr}</p>}
          {summary && (
            <p
              className="text-sm text-slate-700 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(summary, { ALLOWED_TAGS: ['strong'] }) }}
            />
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-bold mb-3">{tr('Materiais')}</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">{tr('Nenhum material enviado ainda.')}</p>
        ) : (
          <div className="space-y-3">
            {materials.map((m) => {
              const st = status(m);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <FileText className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.file_name}</p>
                    <p className="text-sm text-slate-500">{tr('{n} páginas', { n: m.pages || '—' })}</p>
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
          <h2 className="font-bold mb-3">{tr('Desempenho por assunto')}</h2>
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

interface SelectedFileInfo {
  file: File;
  status: 'idle' | 'reading' | 'ready' | 'error';
  pageCount?: number;
  errorMsg?: string;
}

interface Entry {
  name: string;
  status: 'pending' | 'uploading' | 'reading' | 'ready' | 'error';
  msg?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewSubject() {
  const { tr } = useI18n();
  const [params] = useSearchParams();
  const existingId = params.get('subject');
  const nav2 = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;

  const existing = useAsync(() => (existingId ? getSubject(existingId) : Promise.resolve(null)), [existingId]);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [genStart, setGenStart] = useState<number | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [pasted, setPasted] = useState('');

  const subjectId = existingId ?? created;
  const files = selectedFile?.file ? [selectedFile.file] : [];

  const add = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const f = list[0];
    if (!f) return;
    if (!/\.(pdf|pptx)$/i.test(f.name)) {
      setStatus(tr('{name}: só aceitamos PDF e PPTX', { name: f.name }));
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setStatus(tr('{name}: maior que 20 MB', { name: f.name }));
      return;
    }
    setStatus('');
    setSelectedFile({ file: f, status: 'reading' });
    // Valida páginas imediatamente
    try {
      const inspection = await inspectAndExtractFile(f);
      if (inspection.error) {
        setSelectedFile({ file: f, status: 'error', errorMsg: inspection.error, pageCount: inspection.pageCount });
      } else {
        setSelectedFile({ file: f, status: 'ready', pageCount: inspection.pageCount });
      }
    } catch {
      setSelectedFile({ file: f, status: 'ready' });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setStatus('');
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
        if (!name.trim()) throw new Error(tr('Dê um nome para a matéria.'));
        setStatus(tr('Criando matéria…'));
        const s = await createSubject(userId, name.trim(), topic.trim() || null);
        sid = s.id;
        setCreated(s.id);
      }
      if (!sid) throw new Error(tr('Não foi possível criar a matéria.'));
      const already = await countMaterials(sid);
      const incoming = mode === 'text' ? 1 : (selectedFile ? 1 : 0);
      if (already + incoming > 1) throw new Error(tr('Cada matéria aceita apenas 1 arquivo por vez. Remova o material anterior primeiro.'));
      if (incoming === 0 && already === 0) throw new Error(tr('Envie um arquivo ou cole um texto.'));

      if (mode === 'text') {
        if (pasted.trim().length < 200) throw new Error(tr('Cole um texto maior (pelo menos 200 caracteres).'));
        setStatus(tr('Salvando o texto…'));
        await createTextMaterial(userId, sid, pasted.trim(), name.trim() || tr('Texto colado'));
      } else {
        if (!selectedFile?.file) throw new Error(tr('Selecione um arquivo.'));
        if (selectedFile.status === 'error') throw new Error(selectedFile.errorMsg || tr('Arquivo inválido.'));
        setEntries([{ name: selectedFile.file.name, status: 'pending' }]);
        const file = selectedFile.file;
        updateEntry(0, { status: 'uploading' });
        const mat = await uploadMaterial(userId, sid, file);
        updateEntry(0, { status: 'reading' });
        try {
          const ex = await extractText(file);
          if (ex.empty) {
            await setMaterialError(mat.id, tr('Não conseguimos ler texto suficiente neste arquivo (pode ser escaneado ou só com imagens).'));
            updateEntry(0, { status: 'error', msg: tr('Sem texto legível') });
          } else {
            await setMaterialExtracted(mat.id, ex.pages, ex.text);
            updateEntry(0, { status: 'ready' });
          }
        } catch (err) {
          await setMaterialError(mat.id, (err as Error).message);
          updateEntry(0, { status: 'error', msg: (err as Error).message });
        }
      }

      setStatus(tr('Gerando questões com a IA…'));
      setGenStart(Date.now());
      const res = await generateQuestions(sid);
      setStatus(tr('Tudo pronto! {n} questões geradas.', { n: res.inserted }));
      nav2(`/sessao/configurar/${sid}`);
    } catch (e) {
      setGenStart(null);
      setBusy(false);
      setStatus(tr('Erro: {msg}', { msg: (e as Error).message }));
    }
  };

  if (existingId && existing.loading) return <Spinner label={tr('Carregando matéria…')} />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">
        {existingId ? tr('Adicionar material a {name}', { name: existing.data?.name ?? '' }) : tr('Crie uma nova matéria')}
      </h1>

      {!existingId && (
        <>
          <label className="block">
            <span className="font-semibold">{tr('Nome da matéria')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('História — Revolução Francesa')}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
          <label className="block">
            <span className="font-semibold">{tr('Assunto (opcional)')}</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={tr('Ex.: Revolução Francesa')}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
            />
          </label>
        </>
      )}

      <h2 className="font-bold text-lg">{tr('Adicione seu material')}</h2>
      <div className="flex gap-2">
        {(['file', 'text'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-2xl px-4 py-3 font-semibold border-2 ${mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            {m === 'file' ? tr('📎 Enviar arquivo') : tr('✍️ Colar texto')}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <>
          {!selectedFile && (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                add(e.dataTransfer.files);
              }}
              className="block cursor-pointer rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center hover:bg-indigo-50 focus-within:outline-2"
            >
              <Upload className="mx-auto text-indigo-600" size={32} />
              <p className="font-bold mt-3">{tr('Arraste seu arquivo aqui')}</p>
              <p className="text-sm text-slate-500">{tr('ou clique para selecionar')}</p>
              <p className="text-xs text-slate-400 mt-2">
                {tr('Envie 1 arquivo PDF (máx. {maxPdf} páginas) ou PPTX (máx. {maxPptx} slides)', { maxPdf: MAX_PDF_PAGES, maxPptx: MAX_PPTX_SLIDES })}
              </p>
              <input type="file" accept=".pdf,.pptx" className="sr-only" onChange={(e) => add(e.target.files)} />
            </label>
          )}

          {/* Card Visual de Arquivo Selecionado */}
          {selectedFile && (
            <Card className={`flex items-start gap-4 pop border-2 ${
              selectedFile.status === 'error'
                ? 'border-red-300 bg-red-50'
                : selectedFile.status === 'reading'
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-emerald-200 bg-emerald-50/50'
            }`}>
              <div className="shrink-0 mt-0.5">
                {selectedFile.file.name.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-12 h-14 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="text-red-600" size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-14 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Layers className="text-orange-600" size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{selectedFile.file.name}</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {formatFileSize(selectedFile.file.size)}
                  {selectedFile.pageCount != null && selectedFile.pageCount > 0 && (
                    <> · {selectedFile.file.name.toLowerCase().endsWith('.pdf')
                      ? tr('{n} páginas', { n: selectedFile.pageCount })
                      : tr('{n} slides', { n: selectedFile.pageCount })}
                    </>
                  )}
                </p>
                {selectedFile.status === 'reading' && (
                  <p className="text-xs font-semibold text-amber-600 mt-1">{tr('Lendo arquivo…')}</p>
                )}
                {selectedFile.status === 'ready' && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1">{tr('Pronto para gerar')}</p>
                )}
                {selectedFile.status === 'error' && selectedFile.errorMsg && (
                  <p className="text-xs font-semibold text-red-600 mt-1">{selectedFile.errorMsg}</p>
                )}
              </div>
              <button
                onClick={removeFile}
                className="shrink-0 p-2 rounded-xl hover:bg-white/60 text-slate-400 hover:text-red-500 transition"
                aria-label={tr('Remover arquivo')}
              >
                <Trash2 size={18} />
              </button>
            </Card>
          )}
        </>
      ) : (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          placeholder={tr('Cole aqui o texto do seu material (resumo, anotação, capítulo…).')}
          className="w-full rounded-3xl border-2 border-slate-200 px-4 py-4 bg-white"
        />
      )}

      <p className="text-xs text-slate-500">
        {tr('O conteúdo enviado é processado por um serviço de IA para gerar as questões e não deve conter dados pessoais de terceiros.')}
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
            {e.status === 'pending' && tr('Na fila')}
            {e.status === 'uploading' && tr('Enviando…')}
            {e.status === 'reading' && tr('Lendo…')}
            {e.status === 'ready' && tr('✓ Pronto')}
            {e.status === 'error' && tr('✕ Erro')}
          </span>
        </Card>
      ))}

      {genStart !== null ? (
        <Generating label={tr('Gerando questões com a IA…')} startedAt={genStart} />
      ) : (
        status && <p className="text-sm font-medium text-slate-600">{status}</p>
      )}

      <Btn disabled={(mode === 'text' ? pasted.trim().length < 200 : !selectedFile || selectedFile.status !== 'ready') || busy} onClick={run}>
        <Sparkles size={18} />
        {busy ? tr('Processando…') : existingId ? tr('Adicionar e gerar questões') : tr('Criar minha sessão')}
      </Btn>
      {!busy && status.startsWith(tr('Erro')) && subjectId && (
        <Btn v="s" to={`/materias/${subjectId}`}>
          {tr('Ir para a matéria e tentar de novo')}
        </Btn>
      )}
    </div>
  );
}

export function Configure() {
  const { tr } = useI18n();
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
      setMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
      setBusy(false);
    }
  };

  if (data.loading) return <Spinner label={tr('Preparando…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;

  const { subject, questions } = data.data;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Prepare sua sessão')}</h1>
      <Card className="divide-y divide-slate-100">
        {[
          [tr('Matéria'), subject.name],
          [tr('Conteúdo'), subject.topic || subject.name],
          [tr('Tempo'), tr('15 minutos')],
          [tr('Quantidade estimada'), questions ? tr('{n} questões', { n: planned }) : tr('Nenhuma questão ainda')],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between py-3">
            <span className="text-slate-500">{a}</span>
            <span className="font-semibold text-right">{b}</span>
          </div>
        ))}
      </Card>
      <Card className="bg-indigo-50 border-indigo-100">
        <p className="font-bold">{tr('Aprendizado inteligente')}</p>
        <p className="text-sm text-slate-600">{tr('As perguntas serão adaptadas ao seu desempenho.')}</p>
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
            <p className="font-bold">{tr('🎓 Modo prova')}</p>
            <p className="text-sm text-slate-600">{tr('No modo prova você responde sem ver se acertou, como uma prova de verdade. O resultado aparece só no final.')}</p>
          </div>
        </label>
      </Card>
      {questions === 0 && (
        <p className="text-sm text-amber-700">
          {tr('Esta matéria ainda não tem questões. Adicione material e gere as questões primeiro.')}
        </p>
      )}
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <Btn disabled={planned === 0 || busy} onClick={start}>
        {busy ? tr('Começando…') : tr('Começar sessão')}
      </Btn>
    </div>
  );
}

export function Result() {
  const { tr } = useI18n();
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

  if (data.loading) return <Spinner label={tr('Carregando resultado…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.sess) return <EmptyState title={tr('Resultado não encontrado')} action={<Btn to="/dashboard">{tr('Voltar')}</Btn>} />;

  const { sess, topics, profile, week, achievements } = data.data;
  const pct = sess.total ? Math.round((sess.correct / sess.total) * 100) : 0;
  const good = topics.filter((t) => t.correct > 0).sort((a, b) => b.correct - a.correct);
  const bad = topics.filter((t) => t.wrong > 0).sort((a, b) => b.wrong - a.wrong);

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <Icon name="trofeu" size={72} className="pop mx-auto" />
      <h1 className="text-3xl font-extrabold">{tr('Sessão concluída!')}</h1>
      <p className="text-slate-600">{tr('Você completou sua sessão de hoje.')}</p>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-2xl font-extrabold">
            {sess.correct} / {sess.total}
          </p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold">{pct}%</p>
          <p className="text-xs text-slate-500">{tr('de acerto')}</p>
        </Card>
        <Card>
          <p className="text-2xl font-extrabold text-amber-500">+{sess.xp_gained} XP</p>
        </Card>
      </div>
      <Card className="text-left">
        <p className="font-bold text-orange-600 mb-3 flex items-center gap-1.5">
          <Icon name={flameFor(profile?.streak ?? 0)} size={22} />
          {profile && profile.streak > 0
            ? tr('Sua sequência continua! {n} dias', { n: profile.streak })
            : tr('Comece sua sequência!')}
        </p>
        <Week dates={week} />
      </Card>
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        <Card>
          <h2 className="font-bold">{tr('Você mandou bem em:')}</h2>
          {good.length ? good.slice(0, 4).map((t) => <p key={t.topic} className="mt-2">🟢 {t.topic}</p>) : <p className="text-sm text-slate-500 mt-2">—</p>}
        </Card>
        <Card>
          <h2 className="font-bold">{tr('Vale revisar:')}</h2>
          {bad.length ? bad.slice(0, 4).map((t) => <p key={t.topic} className="mt-2">🔴 {t.topic}</p>) : <p className="text-sm text-slate-500 mt-2">{tr('Nada para revisar. 👏')}</p>}
        </Card>
      </div>
      {achievements.length > 0 && (
        <Card className="text-left">
          <h2 className="font-bold mb-2">{tr('Novas conquistas')}</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 font-semibold pop">
                <EmojiIcon emoji={a.icon} size={22} /> {a.title}
              </span>
            ))}
          </div>
        </Card>
      )}
      <div className="flex gap-3 justify-center">
        <Btn to="/revisao">{tr('Revisar meus erros')}</Btn>
        <Btn v="s" to="/dashboard">
          {tr('Voltar ao início')}
        </Btn>
      </div>
    </div>
  );
}

export function Review() {
  const { tr } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id;
  const nav2 = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const weak = useAsync(() => (userId ? statsApi.weakSpots(userId) : Promise.resolve([])), [userId]);

  const practice = async (topic: string, subjectId: string) => {
    if (!subjectId) {
      setMsg(tr('Não foi possível abrir a prática deste assunto.'));
      return;
    }
    setBusy(topic);
    setMsg(null);
    try {
      const id = await startSession({ subjectId, mode: 'topic', topicFilter: topic, planned: 18 });
      nav2(`/sessao/${id}`);
    } catch (e) {
      setMsg(tr('Erro: {msg}', { msg: (e as Error).message }));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Vamos reforçar seus pontos fracos.')}</h1>
      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      {weak.loading ? (
        <Skeleton className="h-28" />
      ) : weak.error ? (
        <ErrorState message={weak.error} onRetry={weak.reload} />
      ) : (weak.data ?? []).length === 0 ? (
        <EmptyState icon="🎉" title={tr('Nenhum erro recente!')} desc={tr('Continue praticando para manter o ritmo.')} action={<Btn to="/dashboard">{tr('Voltar')}</Btn>} />
      ) : (
        (weak.data ?? []).map((w) => (
          <Card key={w.topic} className="flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <h2 className="font-bold text-lg">{w.topic}</h2>
              <p className="text-slate-600 text-sm">
                {tr('Você errou {n} de {of} questões.', { n: w.wrong, of: w.of })}
              </p>
              <p className="text-sm font-semibold mt-1">
                {w.dot} {tr('Nível')}: {w.level}
              </p>
            </div>
            <Btn onClick={() => practice(w.topic, w.subject_id)} disabled={busy === w.topic}>
              {busy === w.topic ? tr('Abrindo…') : tr('Praticar')}
            </Btn>
          </Card>
        ))
      )}
    </div>
  );
}

export function Stats() {
  const { tr } = useI18n();
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

  if (data.loading) return <Spinner label={tr('Carregando estatísticas…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  const { profile, answered, acc, week, masteryVal, subjectList, perfs, weak } = data.data;
  const perfOf = (sid: string) => perfs.find((p) => p.subject_id === sid)?.pct ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{tr('Sua evolução')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['fogo30', tr('{n} dias de sequência', { n: profile?.streak ?? 0 })],
          ['trofeu', tr('{n} XP', { n: profile?.xp ?? 0 })],
          ['livro', tr('{n} questões respondidas', { n: answered })],
          ['alvo', tr('{pct}% de aproveitamento', { pct: acc })],
        ].map(([e, t]) => (
          <Card key={t}>
            <Icon name={e as IconName} size={32} />
            <p className="font-bold mt-1">{t}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold mb-4">{tr('Evolução semanal')}</h2>
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
          <h2 className="font-bold">{tr('Domínio estimado do conteúdo')}</h2>
          {masteryVal === null ? (
            <div className="grid place-items-center h-[150px] text-slate-500 font-semibold">{tr('Ainda coletando dados')}</div>
          ) : (
            <Ring v={masteryVal} />
          )}
          <p className="text-xs text-slate-500">
            {tr('Este índice é baseado no seu desempenho recente, acertos, erros, dificuldade das questões e consistência dos estudos. Ele não representa uma probabilidade real de aprovação.')}
          </p>
        </Card>
      </div>

      <Card>
          <h2 className="font-bold mb-3">{tr('Desempenho por matéria')}</h2>
          {subjectList.length === 0 ? (
            <p className="text-sm text-slate-500">{tr('Sem dados ainda.')}</p>
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
          <h2 className="font-bold">{tr('Continue praticando')}</h2>
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
  const { tr } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id;
  const data = useAsync(() => (userId ? listAchievements(userId) : Promise.resolve([])), [userId]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">{tr('Conquistas')}</h1>
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
              <EmojiIcon emoji={a.icon} size={44} />
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-sm text-slate-600">{a.descr}</p>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {a.unlocked ? (
                      a.unlocked_at ? tr('✓ Desbloqueada em {date}', { date: formatDate(a.unlocked_at) }) : tr('✓ Desbloqueada')
                    ) : (
                      <>
                        <Lock size={12} />
                        {tr('Bloqueada')}
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

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'pt', label: 'Português (PT)' },
  { value: 'en', label: 'English (EN)' },
];

export function Profile() {
  const { tr } = useI18n();
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile();
  const { theme, sound, reminder, toggleTheme, toggleSound, toggleReminder } = useSettings();
  const { lang, setLang } = useI18n();
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
  const displayName = p?.name ?? tr('Estudante');
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
      setMsg(tr('Escolha um arquivo de imagem (JPG, PNG…).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg(tr('A foto deve ter no máximo 5 MB.'));
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
      setMsg(tr('Escolha uma meta entre 5 e 100 questões.'));
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
    const first = await confirmDialog({
      title: tr('Excluir conta'),
      message: tr('Tem certeza que deseja excluir sua conta e TODOS os seus dados?'),
      note: tr('Esta ação não pode ser desfeita.'),
      confirmLabel: tr('Continuar'),
      danger: true,
    });
    if (!first) return;
    const second = await confirmDialog({
      title: tr('Tem certeza absoluta?'),
      message: tr('Materiais, questões e histórico serão apagados permanentemente.'),
      note: tr('Não há como recuperar depois.'),
      confirmLabel: tr('Excluir tudo'),
      danger: true,
    });
    if (!second) return;
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
      <h1 className="text-3xl font-extrabold">{tr('Meu perfil')}</h1>
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
        {uploading && <p className="text-xs text-slate-500 mt-2">{tr('Enviando foto…')}</p>}
        {editing ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2"
              autoFocus
            />
            <Btn onClick={saveName} disabled={busy}>
              {tr('Salvar')}
            </Btn>
          </div>
        ) : (
          <h2 className="text-xl font-bold mt-3">{displayName}</h2>
        )}
        <p className="text-slate-600">{tr('Nível {n}', { n: p?.level ?? 1 })}</p>
        <div className="mt-3">
          <Bar v={(xpInLevel(xp) / XP_PER_LEVEL) * 100} color="bg-amber-400" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          XP: {xpInLevel(xp)} / {XP_PER_LEVEL}
        </p>
        <p className="mt-2 font-semibold inline-flex items-center gap-1.5">
          <Icon name={flameFor(p?.streak ?? 0)} size={20} /> {tr('Sequência')}: {tr('{n} dias', { n: p?.streak ?? 0 })}
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [extra.data?.answered ?? 0, tr('questões')],
          [`${extra.data?.acc ?? 0}%`, tr('acerto')],
          [extra.data?.subjects ?? 0, tr('matérias')],
        ].map(([v, l]) => (
          <Card key={l}>
            <p className="text-xl font-extrabold">{v}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-bold mb-1">{tr('Preferências')}</h2>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium">{tr('Idioma da interface (Language)')}</p>
            <p className="text-sm text-slate-500">{tr('Escolha entre Português e Inglês.')}</p>
          </div>
          <div
            role="group"
            aria-label={tr('Idioma da interface')}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-2xl border border-slate-200 bg-white p-1"
          >
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={lang === o.value}
                onClick={() => setLang(o.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  lang === o.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Tema escuro')}</p>
            <p className="text-sm text-slate-500">{tr('Melhor para estudar à noite.')}</p>
          </div>
          <Switch on={theme === 'dark'} onChange={toggleTheme} label={tr('Tema escuro')} />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Sons ao responder')}</p>
            <p className="text-sm text-slate-500">{tr('Um "plim" no acerto e um "tadam" no erro.')}</p>
          </div>
          <Switch on={sound} onChange={toggleSound} label={tr('Sons ao responder')} />
        </div>
        <div className="py-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{tr('Meta diária de questões')}</p>
              <p className="text-sm text-slate-500">{tr('Quantas questões você quer resolver por dia?')}</p>
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
                {savingGoal ? tr('…') : tr('Salvar')}
              </Btn>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
              <p className="font-medium">{tr('Lembrete diário')}</p>
              <p className="text-sm text-slate-500">{tr('Aviso às 19h se você ainda não bateu a meta.')}</p>
            </div>
            <Switch on={reminder} onChange={() => void toggleReminder()} label={tr('Lembrete diário')} />
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
              <p className="font-medium">{tr('Suporte')}</p>
              <p className="text-sm text-slate-500">{tr('Precisa de ajuda? Fale com a gente.')}</p>
            </div>
            <Link to="/suporte" className="text-indigo-600 font-semibold text-sm">
              {tr('Abrir')}
            </Link>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Redes sociais')}</p>
            <p className="text-sm text-slate-500">{tr('Acompanhe as novidades do OmniLearn.')}</p>
          </div>
          <Link to="/redes" className="font-semibold text-indigo-600">
            {tr('Ver')}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-slate-100">
          <div>
            <p className="font-medium">{tr('Diretrizes e termos')}</p>
            <p className="text-sm text-slate-500">{tr('Um espaço para tirar dúvidas e enviar sugestões.')}</p>
          </div>
          <Link to="/diretrizes" className="font-semibold text-indigo-600">{tr('Ver')}</Link>
        </div>
      </Card>

      {msg && <p className="text-sm font-medium text-red-600">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {!editing && <Btn v="s" onClick={startEdit}>{tr('Editar perfil')}</Btn>}
        <Btn
          v="s"
          onClick={() =>
            shareText(
              tr('Estou usando o OmniLearn! ✨ Sequência de {n} dias, nível {level} e {q} questões respondidas. 🚀', {
                n: p?.streak ?? 0,
                level: p?.level ?? 1,
                q: extra.data?.answered ?? 0,
              }),
            )
          }
        >
          <Share2 size={16} />
          {tr('Compartilhar')}
        </Btn>
        <Btn v="s" onClick={removeAccount} disabled={busy}>
          <Trash2 size={16} /> {tr('Excluir minha conta e meus dados')}
        </Btn>
      </div>
    </div>
  );
}

export function Flashcards() {
  const { tr } = useI18n();
  const { id } = useParams();
  const nav2 = useNavigate();
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

  if (data.loading) return <Spinner label={tr('Carregando flashcards…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  if (!card) {
    return (
      <div className="max-w-xl">
        <EmptyState
          icon="🎯"
          title={cards.length === 0 ? tr('Nenhum flashcard por aqui ainda') : tr('Você revisou todos os flashcards de hoje!')}
          desc={cards.length === 0 ? tr('Resolva sessões para os flashcards aparecerem.') : tr('Volte amanhã para revisar de novo. 🗓️')}
          action={<Btn onClick={() => nav2('/dashboard')}>{tr('Voltar ao início')}</Btn>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🃏 Flashcards</h1>
        <span className="text-sm font-semibold text-slate-500">
          {tr('{n} de {total}', { n: idx + 1, total: cards.length })}
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
            <p className="text-sm font-bold text-emerald-600">{tr('Resposta')}</p>
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
          {tr('Mostrar resposta')}
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
            {result.xp_gained > 0 ? tr('+{n} XP 🎉 ', { n: result.xp_gained }) : ''}{tr('caixa {n} de 5', { n: result.box })}
          </p>
          <Btn className="w-full" onClick={next}>
            {idx + 1 < cards.length ? tr('Próximo') : tr('Concluir')}
          </Btn>
        </div>
      )}
    </div>
  );
}

export function PrintSubject() {
  const { tr } = useI18n();
  const { id } = useParams();
  const data = useAsync(async () => {
    if (!id) return null;
    const [subject, questions] = await Promise.all([getSubject(id), listQuestions(id)]);
    return { subject, questions };
  }, [id]);

  if (data.loading) return <Spinner label={tr('Preparando impressão…')} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data?.subject) return <EmptyState title={tr('Matéria não encontrada')} action={<Btn to="/materias">{tr('Voltar')}</Btn>} />;

  const { subject, questions } = data.data;

  return (
    <div className="max-w-3xl mx-auto p-6 text-slate-900">
      <div className="flex items-center justify-between mb-6 no-print">
        <Btn to={`/materias/${subject.id}`} v="s">
          {tr('Voltar')}
        </Btn>
        <Btn onClick={() => window.print()}>
          <Printer size={16} /> {tr('Imprimir / salvar PDF')}
        </Btn>
      </div>
      <h1 className="text-2xl font-extrabold">{subject.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {subject.topic || ''} · {tr('{n} questões', { n: questions.length })}
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
            {q.type === 'short' && (
              <div className="mt-2 ml-4">{tr('Resposta')}: ______________________________</div>
            )}
          </li>
        ))}
      </ol>

      <h2 className="text-xl font-extrabold mt-10 mb-3">{tr('Gabarito')}</h2>
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
