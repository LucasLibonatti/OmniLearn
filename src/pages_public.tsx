import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  FileText,
  Layers,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Timer,
  TrendingUp,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { Bar, Btn, Card, LangSwitch, Logo, StatusDot } from './ui';
import { Icon, mascotSrc } from './icons';
import { FlatIcon, type FlatIconName } from './brand-icons';
import { useSettings } from './hooks/useSettings';
import { useI18n, type TKey } from './i18n';

const steps: [typeof Upload, TKey, TKey][] = [
  [Upload, 'how.1.t', 'how.1.d'],
  [Sparkles, 'how.2.t', 'how.2.d'],
  [Timer, 'how.3.t', 'how.3.d'],
  [TrendingUp, 'how.4.t', 'how.4.d'],
];

const feats: [FlatIconName, TKey][] = [
  ['flame', 'feats.streak'],
  ['sparkles', 'feats.review'],
  ['trend', 'feats.progress'],
  ['trophy', 'feats.xp'],
];

interface DemoQuestion {
  materia: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

const showcasePt: DemoQuestion[] = [
  {
    materia: 'História',
    pergunta: 'Qual acontecimento marca o início da Revolução Francesa em 1789?',
    opcoes: ['Congresso de Viena', 'Queda da Bastilha', 'Revolução Industrial'],
    correta: 1,
    explicacao: 'A Tomada da Bastilha (14/07/1789) simbolizou a queda do absolutismo na França.',
  },
  {
    materia: 'Biologia',
    pergunta: 'Qual organela é responsável pela respiração celular e produção de ATP?',
    opcoes: ['Mitocôndria', 'Ribossomo', 'Lisossomo'],
    correta: 0,
    explicacao: 'As mitocôndrias convertem nutrientes em energia química (ATP) para a célula.',
  },
  {
    materia: 'Matemática',
    pergunta: 'Qual é o valor de x na equação 2x + 6 = 18?',
    opcoes: ['6', '9', '12'],
    correta: 0,
    explicacao: 'Subtraindo 6 dos dois lados obtemos 2x = 12, logo x = 6.',
  },
  {
    materia: 'Redes',
    pergunta: 'Qual protocolo garante entrega confiável e ordenada de pacotes na internet?',
    opcoes: ['UDP', 'TCP', 'ICMP'],
    correta: 1,
    explicacao: 'O TCP usa handshake, confirmação (ACK) e retransmissão para garantir entrega confiável.',
  },
];

const showcaseEn: DemoQuestion[] = [
  {
    materia: 'History',
    pergunta: 'Which event marks the beginning of the French Revolution in 1789?',
    opcoes: ['Congress of Vienna', 'Storming of the Bastille', 'Industrial Revolution'],
    correta: 1,
    explicacao: 'The Storming of the Bastille (July 14, 1789) became the symbol of the end of absolutism.',
  },
  {
    materia: 'Biology',
    pergunta: 'Which organelle is responsible for cellular respiration and ATP production?',
    opcoes: ['Mitochondria', 'Ribosome', 'Lysosome'],
    correta: 0,
    explicacao: 'Mitochondria convert nutrients into usable chemical energy (ATP) for the cell.',
  },
  {
    materia: 'Mathematics',
    pergunta: 'What is the value of x in the equation 2x + 6 = 18?',
    opcoes: ['6', '9', '12'],
    correta: 0,
    explicacao: 'Subtracting 6 from both sides gives 2x = 12, so x = 6.',
  },
  {
    materia: 'Networking',
    pergunta: 'Which protocol guarantees reliable, ordered packet delivery over the internet?',
    opcoes: ['UDP', 'TCP', 'ICMP'],
    correta: 1,
    explicacao: 'TCP uses handshakes, acknowledgments (ACKs) and retransmission for reliable delivery.',
  },
];

function Showcase({
  t,
  lang,
  onStart,
}: {
  t: ReturnType<typeof useI18n>['t'];
  lang: 'pt' | 'en';
  onStart: () => void;
}) {
  const showcase = lang === 'en' ? showcaseEn : showcasePt;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  const d = showcase[i];
  const answered = picked !== null;
  const isRight = picked === d.correta;

  const choose = (k: number) => {
    if (answered) return;
    setPicked(k);
    if (k === d.correta) {
      setScore((s) => s + 1);
      setXp((x) => x + 10);
    }
  };

  const advance = () => {
    if (i + 1 < showcase.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  };

  const reset = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setXp(0);
    setDone(false);
  };

  if (done) {
    return (
      <Card className="shadow-[0_18px_50px_-28px_rgba(15,23,42,.45)] text-center py-8 px-6">
        <Icon name="party" size={60} className="pop mx-auto" />
        <h3 className="text-2xl font-black mt-3">{t('showcase.done.title', { xp })}</h3>
        <p className="text-slate-600 font-semibold mt-2 max-w-lg mx-auto">
          {t('showcase.done.sub', { score, total: showcase.length })}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Btn onClick={onStart}>
            {t('cta.button')} <ArrowRight size={17} />
          </Btn>
          <Btn v="s" onClick={reset}>
            <RotateCcw size={16} /> {t('showcase.replay')}
          </Btn>
        </div>
      </Card>
    );
  }

  const pct = Math.round(((i + (answered ? 1 : 0)) / showcase.length) * 100);

  return (
    <Card className="shadow-[0_18px_50px_-28px_rgba(15,23,42,.45)] relative">
      <div key={i} className="fade">
        <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-extrabold text-slate-500">
          <span>
            {d.materia} · {t('showcase.question', { n: i + 1, total: showcase.length })}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {t('showcase.hint')}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 font-black">
              {xp} XP
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-100 mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(12, pct)}%` }}
          />
        </div>
        <p className="font-extrabold text-lg sm:text-xl mt-5">{d.pergunta}</p>
        <div className="mt-4 grid gap-2.5 relative">
          {d.opcoes.map((o, k) => {
            const right = answered && k === d.correta;
            const wrong = answered && picked === k && k !== d.correta;
            return (
              <button
                key={o}
                type="button"
                disabled={answered}
                onClick={() => choose(k)}
                className={`flex items-center justify-between gap-3 text-left rounded-2xl border-2 px-4 py-3 font-bold transition-all duration-200 cursor-pointer disabled:cursor-default ${
                  right
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 pop'
                    : wrong
                      ? 'border-red-400 bg-red-50 text-red-700 shake'
                      : 'border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600 shrink-0">
                    {'ABC'[k]}
                  </span>
                  {o}
                </span>
                {right && <Check size={18} className="shrink-0 text-emerald-600" />}
                {wrong && <X size={18} className="shrink-0 text-red-500" />}
              </button>
            );
          })}
          {answered && isRight && (
            <span className="xp absolute right-2 -top-6 font-black text-amber-500 text-lg pointer-events-none">
              +10 XP
            </span>
          )}
        </div>

        {answered && (
          <div
            className={`mt-4 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pop ${
              isRight ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="space-y-0.5">
              <p className={`text-sm font-black inline-flex items-center gap-1.5 ${isRight ? 'text-emerald-700' : 'text-red-700'}`}>
                {isRight ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {isRight ? t('showcase.correct') : t('showcase.wrong')}
              </p>
              <p className="text-sm font-semibold text-slate-700">{d.explicacao}</p>
            </div>
            <Btn onClick={advance} className="shrink-0 px-5 py-2.5 text-sm">
              {i + 1 < showcase.length ? t('showcase.next') : t('showcase.finish')} <ArrowRight size={16} />
            </Btn>
          </div>
        )}
      </div>
    </Card>
  );
}

function ProductPreview({ t, lang }: { t: ReturnType<typeof useI18n>['t']; lang: 'pt' | 'en' }) {
  const [tab, setTab] = useState<'dashboard' | 'ai' | 'flashcards'>('dashboard');
  const [flipped, setFlipped] = useState(false);
  const isEn = lang === 'en';

  const tabs = [
    { id: 'dashboard' as const, label: t('preview.tab.dashboard'), Icon: LayoutDashboard },
    { id: 'ai' as const, label: t('preview.tab.ai'), Icon: Sparkles },
    { id: 'flashcards' as const, label: t('preview.tab.flashcards'), Icon: Layers },
  ];

  const days = isEn ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return (
    <section className="max-w-6xl mx-auto px-5 pb-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-black tracking-widest text-indigo-600 uppercase">{t('preview.eyebrow')}</p>
        <h2 className="text-3xl font-black mt-2">{t('preview.title')}</h2>
        <p className="text-slate-600 font-semibold mt-2">{t('preview.sub')}</p>
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-2" role="tablist">
        {tabs.map(({ id, label, Icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setFlipped(false);
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold border transition cursor-pointer ${
              tab === id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <TabIcon size={16} />
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-0 overflow-hidden border border-slate-200 shadow-[0_20px_50px_-30px_rgba(15,23,42,.45)]">
        {/* Barra superior estilo app */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-bold text-slate-400">educacao-eficiente.vercel.app</span>
          <span className="text-xs font-extrabold text-indigo-600">OmniLearn</span>
        </div>

        <div className="p-6 sm:p-8 fade" key={tab}>
          {tab === 'dashboard' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-100">
                <div className="flex items-center gap-3">
                  <Icon name="fogo15" size={44} />
                  <div>
                    <p className="text-2xl font-black">{isEn ? '15 days' : '15 dias'}</p>
                    <p className="text-xs font-semibold text-slate-600">{isEn ? 'Active streak' : 'Ofensiva ativa'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {days.map((d, idx) => (
                    <div key={idx} className="flex-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400">{d}</span>
                      <div
                        className={`mt-1 h-7 rounded-lg grid place-items-center text-xs font-black ${
                          idx < 6 ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-300'
                        }`}
                      >
                        {idx < 6 ? '✓' : '·'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">{isEn ? "Today's goal" : 'Meta de hoje'}</p>
                    <p className="text-xl font-black mt-1">{isEn ? '14 / 18 questions' : '14 / 18 questões'}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Bar v={78} />
                    <p className="text-xs font-semibold text-slate-500">
                      {isEn ? '4 questions left to keep your streak' : 'Faltam 4 questões para bater a meta'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5 bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700">
                      {isEn ? 'Computer Networks' : 'Redes de Computadores'}
                    </span>
                    <span className="text-xs font-black text-emerald-600">88%</span>
                  </div>
                  <div className="mt-3">
                    <p className="font-extrabold">{isEn ? 'TCP/IP & OSI Model' : 'Modelo OSI e TCP/IP'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{isEn ? '28 AI questions · Studied today' : '28 questões IA · Estudado hoje'}</p>
                  </div>
                  <div className="mt-3">
                    <Bar v={88} color="bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              <div className="rounded-2xl p-5 bg-slate-50 border border-slate-100">
                <span className="w-10 h-10 rounded-xl bg-red-100 text-red-600 grid place-items-center">
                  <FileText size={20} />
                </span>
                <p className="text-xs font-black text-slate-400 mt-3">1. UPLOAD LOCAL</p>
                <p className="font-extrabold mt-0.5">Aula04_Redes.pdf</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {isEn ? '18 pages · Extracted in your browser (raw PDF never stored)' : '18 páginas · Lido no seu navegador (PDF bruto nunca salvo)'}
                </p>
              </div>

              <div className="rounded-2xl p-5 bg-indigo-50 border border-indigo-100">
                <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white grid place-items-center">
                  <Sparkles size={20} />
                </span>
                <p className="text-xs font-black text-indigo-600 mt-3">2. GROQ · LLAMA 3.3 70B</p>
                <p className="font-extrabold mt-0.5">{isEn ? '28 adaptive questions' : '28 questões adaptativas'}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {isEn ? 'Multiple choice, T/F, fill-in-the-blank, match & short answer' : 'Múltipla escolha, V/F, lacunas, associação e resposta curta'}
                </p>
              </div>

              <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-100">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center">
                  <CheckCircle2 size={20} />
                </span>
                <p className="text-xs font-black text-emerald-700 mt-3">3. {isEn ? 'READY TO TRAIN' : 'PRONTO PARA TREINAR'}</p>
                <p className="font-extrabold mt-0.5">{isEn ? 'Summary + Exam Mode' : 'Resumo IA + Modo Prova'}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {isEn ? 'Instant explanations when you miss + printable PDF exam' : 'Explicação extra quando errar + impressão com gabarito'}
                </p>
              </div>
            </div>
          )}

          {tab === 'flashcards' && (
            <div className="grid md:grid-cols-2 gap-5 items-stretch">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="text-left rounded-2xl p-5 bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 transition flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-indigo-600 uppercase">
                    {isEn ? 'LEITNER FLASHCARD' : 'FLASHCARD LEITNER'}
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full">
                    {flipped ? t('preview.flipped') : t('preview.flip')}
                  </span>
                </div>
                <div className="my-4">
                  <p className="text-lg font-extrabold">
                    {isEn
                      ? 'What is the main difference between TCP and UDP?'
                      : 'Qual é a principal diferença entre TCP e UDP?'}
                  </p>
                  {flipped && (
                    <p className="mt-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 fade">
                      {isEn
                        ? 'TCP is connection-oriented and guarantees ordered delivery; UDP is connectionless and faster for real-time traffic.'
                        : 'TCP é orientado à conexão e garante entrega ordenada; UDP é mais leve e rápido para tráfego em tempo real.'}
                    </p>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500">
                  {isEn ? 'Spaced repetition boxes 1 → 5 (1d, 3d, 7d, 14d, 30d)' : 'Caixas de revisão espaçada 1 → 5 (1d, 3d, 7d, 14d, 30d)'}
                </p>
              </button>

              <div className="rounded-2xl p-5 bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-extrabold">
                  <BarChart3 size={18} className="text-indigo-600" />
                  <span>{isEn ? 'Mastery by topic' : 'Domínio por assunto'}</span>
                </div>
                <div className="space-y-3 my-4">
                  {[
                    { name: isEn ? 'OSI Model' : 'Modelo OSI', pct: 92, tone: 'emerald' as const, bar: 'bg-emerald-500' },
                    { name: isEn ? 'TCP / UDP Protocols' : 'Protocolos TCP / UDP', pct: 84, tone: 'yellow' as const, bar: 'bg-amber-500' },
                    { name: isEn ? 'IPv4 Subnetting' : 'Sub-redes IPv4', pct: 58, tone: 'rose' as const, bar: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="inline-flex items-center gap-2">
                          <StatusDot tone={item.tone} />
                          {item.name}
                        </span>
                        <span>{item.pct}%</span>
                      </div>
                      <Bar v={item.pct} color={item.bar} />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {isEn ? 'Weak topics are automatically prioritized in your next session.' : 'Tópicos fracos são priorizados automaticamente na próxima sessão.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

export function Landing() {
  const { theme, toggleTheme } = useSettings();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mood, setMood] = useState<'idle' | 'hop' | 'wiggle'>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const play = (m: 'hop' | 'wiggle') => {
    setMood(m);
    schedule(() => setMood('idle'), 800);
  };

  const start = () => {
    play('hop');
    schedule(() => navigate('/cadastro'), 220);
  };

  const mascotClass = mood === 'hop' ? 'hop' : mood === 'wiggle' ? 'wiggle' : 'breathe';

  return (
    <div className="min-h-screen mesh">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-3 p-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          <button
            aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Btn to="/login" v="s" className="hidden sm:inline-flex">
            {t('nav.login')}
          </Btn>
          <Btn onClick={start}>{t('nav.start')}</Btn>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="max-w-6xl mx-auto px-5 pt-4 pb-14 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="order-1 fade">
          <button
            type="button"
            onClick={() => play('wiggle')}
            aria-label={t('hero.mascotHint')}
            className="group block w-full"
          >
            <img
              src={mascotSrc(theme)}
              alt=""
              aria-hidden
              width={1140}
              height={578}
              fetchPriority="high"
              draggable={false}
              className={`block w-full h-auto drop-shadow-[0_22px_40px_rgba(15,23,42,.18)] ${mascotClass}`}
            />
          </button>
        </div>

        <div className="order-2 fade">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-extrabold text-slate-600 shadow-sm">
            <FlatIcon name="bolt" size={20} bare /> {t('hero.badge')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-[1.08] mt-5">
            {t('hero.title.a')}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              {t('hero.title.b')}
            </span>
            {t('hero.title.c')}
          </h1>
          <p className="text-slate-600 mt-4 text-lg font-semibold">{t('hero.sub')}</p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Btn onClick={start} className="text-[17px] px-8 py-4">
              {t('hero.cta')} <ArrowRight size={18} />
            </Btn>
            <Btn v="s" to="/login" className="text-[17px] px-8 py-4">
              {t('hero.haveAccount')}
            </Btn>
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-500">{t('hero.trust')}</p>
        </div>
      </section>

      {/* ===== Mini-quiz interativo de verdade ===== */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="relative">
          <div className="absolute -top-6 -left-4 hidden sm:block z-10 pointer-events-none">
            <FlatIcon name="trophy" size={58} className="floaty" />
          </div>
          <div className="absolute -bottom-6 -right-2 hidden sm:block z-10 pointer-events-none">
            <FlatIcon name="sparkles" size={52} className="floaty" style={{ animationDelay: '1s' }} />
          </div>
          <Showcase t={t} lang={lang} onStart={start} />
        </div>
      </section>

      {/* ===== Prévia real da plataforma ===== */}
      <ProductPreview t={t} lang={lang} />

      {/* ===== Recursos ===== */}
      <section className="max-w-6xl mx-auto px-5 pb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {feats.map(([icone, titulo]) => (
          <Card key={titulo} className="text-center hover:-translate-y-1.5 transition-transform duration-300">
            <FlatIcon name={icone} size={52} className="mx-auto float" />
            <p className="font-extrabold mt-3">{t(titulo)}</p>
          </Card>
        ))}
      </section>

      {/* ===== Como funciona ===== */}
      <section id="como" className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-3xl font-black text-center">{t('how.title')}</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([I, tk, dk], k) => (
            <Card key={tk} className="shine">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-300/50">
                <I size={22} />
              </span>
              <p className="mt-4 text-xs font-black text-slate-400">{t('how.step', { n: k + 1 })}</p>
              <h3 className="font-extrabold text-lg">{t(tk)}</h3>
              <p className="text-slate-600 mt-1 font-semibold">{t(dk)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <Card className="text-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-0 shadow-2xl shadow-indigo-300/60 p-8">
          <h2 className="text-2xl font-black">{t('cta.title')}</h2>
          <p className="text-indigo-100 mt-2 font-semibold">{t('cta.sub')}</p>
          <div className="mt-5 flex justify-center">
            <Btn v="s" onClick={start} className="font-black">
              {t('cta.button')}
            </Btn>
          </div>
        </Card>
      </section>

      <footer className="border-t border-slate-200/70 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div className="sm:hidden">
            <LangSwitch />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {t('footer.tagline')} ·{' '}
            <Link to="/suporte" className="font-extrabold text-indigo-600 hover:underline">
              {t('nav.support')}
            </Link>{' '}
            ·{' '}
            <Link to="/diretrizes" className="font-extrabold text-indigo-600 hover:underline">
              {t('nav.guidelines')}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
