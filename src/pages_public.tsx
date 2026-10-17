import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Timer, TrendingUp, Sun, Moon, ArrowRight, Check } from 'lucide-react';
import { Btn, Card, Logo, LangSwitch } from './ui';
import { mascotSrc } from './icons';
import { FlatIcon, type FlatIconName } from './brand-icons';
import { Socials } from './components/Socials';
import { useSettings } from './hooks/useSettings';
import { useI18n } from './i18n';
import type { TKey } from './i18n';

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

// Exemplo que fica girando na página inicial a cada poucos segundos.
const showcasePt = [
  {
    materia: 'História',
    n: 7,
    total: 18,
    seq: 12,
    progresso: 40,
    pergunta: 'Qual acontecimento marca o início da Revolução Francesa?',
    opcoes: ['Congresso de Viena', 'Queda da Bastilha', 'Revolução Industrial'],
    correta: 1,
  },
  {
    materia: 'Biologia',
    n: 3,
    total: 15,
    seq: 27,
    progresso: 20,
    pergunta: 'Qual organela é responsável pela respiração celular?',
    opcoes: ['Mitocôndria', 'Ribossomo', 'Lisossomo'],
    correta: 0,
  },
  {
    materia: 'Matemática',
    n: 11,
    total: 20,
    seq: 41,
    progresso: 55,
    pergunta: 'Qual é o valor de x na equação 2x + 6 = 18?',
    opcoes: ['6', '9', '12'],
    correta: 0,
  },
  {
    materia: 'Geografia',
    n: 5,
    total: 16,
    seq: 8,
    progresso: 33,
    pergunta: 'Qual é o maior bioma brasileiro?',
    opcoes: ['Cerrado', 'Amazônia', 'Caatinga'],
    correta: 1,
  },
];

const showcaseEn = [
  {
    materia: 'History',
    n: 7,
    total: 18,
    seq: 12,
    progresso: 40,
    pergunta: 'Which event marks the beginning of the French Revolution?',
    opcoes: ['Congress of Vienna', 'Storming of the Bastille', 'Industrial Revolution'],
    correta: 1,
  },
  {
    materia: 'Biology',
    n: 3,
    total: 15,
    seq: 27,
    progresso: 20,
    pergunta: 'Which organelle is responsible for cellular respiration?',
    opcoes: ['Mitochondria', 'Ribosome', 'Lysosome'],
    correta: 0,
  },
  {
    materia: 'Mathematics',
    n: 11,
    total: 20,
    seq: 41,
    progresso: 55,
    pergunta: 'What is the value of x in the equation 2x + 6 = 18?',
    opcoes: ['6', '9', '12'],
    correta: 0,
  },
  {
    materia: 'Geography',
    n: 5,
    total: 16,
    seq: 8,
    progresso: 33,
    pergunta: "What is Brazil's largest biome?",
    opcoes: ['Cerrado', 'Amazon', 'Caatinga'],
    correta: 1,
  },
];

function Showcase({ t, lang }: { t: ReturnType<typeof useI18n>['t']; lang: 'pt' | 'en' }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const showcase = lang === 'en' ? showcaseEn : showcasePt;

  useEffect(() => {
    setRevealed(false);
    const reveal = setTimeout(() => setRevealed(true), 1400);
    const next = setTimeout(() => setI((v) => (v + 1) % showcase.length), 4200);
    return () => {
      clearTimeout(reveal);
      clearTimeout(next);
    };
  }, [i]);

  const d = showcase[i];
  return (
    <Card className="shadow-[0_18px_50px_-28px_rgba(15,23,42,.45)]">
      <div key={i} className="fade">
        <div className="flex justify-between items-center text-sm font-extrabold text-slate-500">
          <span>
            {d.materia} · {t('showcase.question', { n: d.n, total: d.total })}
          </span>
          <span className="inline-flex items-center gap-1 text-violet-600">
            <FlatIcon name="flame" size={20} bare /> {d.seq}
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
            style={{ width: `${d.progresso}%` }}
          />
        </div>
        <p className="font-extrabold text-lg mt-5">{d.pergunta}</p>
        <div className="mt-4 grid gap-2.5">
          {d.opcoes.map((o, k) => {
            const right = revealed && k === d.correta;
            return (
              <div
                key={o}
                className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 font-bold transition-all duration-300 ${
                  right
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                {o}
                {right && <Check size={18} className="shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function Landing() {
  const { theme, toggleTheme } = useSettings();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mood, setMood] = useState<'idle' | 'hop' | 'wiggle'>('idle');

  const play = (m: 'hop' | 'wiggle') => {
    setMood(m);
    window.setTimeout(() => setMood('idle'), 800);
  };

  const start = () => {
    play('hop');
    window.setTimeout(() => navigate('/cadastro'), 260);
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

      {/* ===== Hero: mascote à esquerda, texto e botões à direita ===== */}
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
              draggable={false}
              className={`block w-full drop-shadow-[0_22px_40px_rgba(15,23,42,.18)] ${mascotClass}`}
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

      {/* ===== Demonstração interativa ===== */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="relative perspective">
          <div className="absolute -top-6 -left-4 hidden sm:block z-10">
            <FlatIcon name="trophy" size={58} className="floaty" />
          </div>
          <div className="absolute -bottom-6 -right-2 hidden sm:block z-10">
            <FlatIcon name="sparkles" size={52} className="floaty" style={{ animationDelay: '1s' }} />
          </div>
          <Showcase t={t} lang={lang} />
        </div>
      </section>

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
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-5 text-center">
          <Logo />
          <Socials />
          <div className="sm:hidden">
            <LangSwitch />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {t('footer.tagline')} ·{' '}
            <Link to="/suporte" className="font-extrabold text-indigo-600">
              {t('nav.support')}
            </Link>{' '}
            ·{' '}
            <Link to="/redes" className="font-extrabold text-indigo-600">
              {t('nav.socials')}
            </Link>{' '}
            ·{' '}
            <Link to="/diretrizes" className="font-extrabold text-indigo-600">
              {t('nav.guidelines')}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
