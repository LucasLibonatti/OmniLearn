import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles, Timer, TrendingUp, Sun, Moon, ArrowRight } from 'lucide-react';
import { Btn, Card, Logo } from './ui';
import { Icon, flameFor, type IconName } from './icons';
import { Socials } from './components/Socials';
import { useSettings } from './hooks/useSettings';

const steps = [
  [Upload, 'Envie seus materiais', 'Adicione de 1 a 3 slides ou arquivos da matéria.'],
  [Sparkles, 'A IA cria seu treino', 'Seu conteúdo é transformado em perguntas e exercícios.'],
  [Timer, 'Estude por 15 minutos', 'Responda, aprenda com seus erros e evolua.'],
  [TrendingUp, 'Acompanhe sua evolução', 'Veja seus pontos fortes, dificuldades e domínio estimado.'],
] as const;

const feats: [IconName, string][] = [
  ['fogo15', 'Sequência diária'],
  ['raio', 'Revisão inteligente'],
  ['foguete', 'Evolução por assunto'],
  ['trofeu', 'XP e conquistas'],
];

// Exemplo que fica girando na página inicial a cada 3 segundos.
const showcase = [
  {
    materia: 'História',
    n: 7,
    total: 18,
    seq: 12,
    progresso: 'w-2/5',
    pergunta: 'Qual acontecimento marca o início da Revolução Francesa?',
    opcoes: ['Congresso de Viena', 'Queda da Bastilha', 'Revolução Industrial'],
    correta: 1,
  },
  {
    materia: 'Biologia',
    n: 3,
    total: 15,
    seq: 27,
    progresso: 'w-1/5',
    pergunta: 'Qual organela é responsável pela respiração celular?',
    opcoes: ['Mitocôndria', 'Ribossomo', 'Lisossomo'],
    correta: 0,
  },
  {
    materia: 'Matemática',
    n: 11,
    total: 20,
    seq: 41,
    progresso: 'w-3/5',
    pergunta: 'Qual é o valor de x na equação 2x + 6 = 18?',
    opcoes: ['6', '9', '12'],
    correta: 0,
  },
  {
    materia: 'Geografia',
    n: 5,
    total: 16,
    seq: 8,
    progresso: 'w-1/3',
    pergunta: 'Qual é o maior bioma brasileiro?',
    opcoes: ['Cerrado', 'Amazônia', 'Caatinga'],
    correta: 1,
  },
];

function Showcase() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % showcase.length), 3000);
    return () => clearInterval(t);
  }, []);
  const d = showcase[i];
  return (
    <Card className="tilt shadow-2xl shadow-indigo-200/70">
      <div key={i} className="fade">
        <div className="flex justify-between text-sm font-semibold text-slate-500">
          <span>
            {d.materia} · Questão {d.n} de {d.total}
          </span>
          <span className="inline-flex items-center gap-1 text-orange-500">
            <Icon name={flameFor(d.seq)} size={18} /> {d.seq}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 mt-3 overflow-hidden">
          <div className={`h-full rounded-full bg-indigo-600 transition-all duration-700 ${d.progresso}`} />
        </div>
        <p className="font-bold text-lg mt-5">{d.pergunta}</p>
        <div className="mt-4 grid gap-2">
          {d.opcoes.map((o, k) => (
            <div
              key={o}
              className={`rounded-2xl border-2 px-4 py-3 font-medium ${
                k === d.correta ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'
              }`}
            >
              {o}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function Landing() {
  const { theme, toggleTheme } = useSettings();
  return (
    <div className="min-h-screen mesh">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-5">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Btn to="/login" v="s">
            Entrar
          </Btn>
          <Btn to="/cadastro" className="hidden sm:inline-flex">
            Começar
          </Btn>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-6 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div className="fade">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">
            <Icon name="raio" size={20} /> Estude 15 minutos por dia
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mt-4">
            Transforme seus materiais em um treino que{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              evolui com você
            </span>
            .
          </h1>
          <p className="text-slate-600 mt-4 text-lg">
            Envie seus slides e deixe a IA criar perguntas adaptadas ao seu ritmo — com sequência diária, XP e conquistas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Btn to="/cadastro">
              Começar agora <ArrowRight size={18} />
            </Btn>
            <Btn v="s" to="/login">
              Já tenho conta
            </Btn>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Icon name="coroa" size={34} className="floaty" />
            <Icon name="alvo" size={34} className="floaty" style={{ animationDelay: '.6s' }} />
            <Icon name="livro" size={34} className="floaty" style={{ animationDelay: '1.2s' }} />
            <span className="text-sm text-slate-500">Aprenda no seu tempo, com foco no que você precisa.</span>
          </div>
        </div>

        <div className="relative perspective">
          <div className="absolute -top-6 -left-6 hidden sm:block">
            <Icon name="trofeu" size={64} className="floaty" />
          </div>
          <div className="absolute -bottom-6 -right-2 hidden sm:block">
            <Icon name="foguete" size={60} className="floaty" style={{ animationDelay: '1s' }} />
          </div>
          <Showcase />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {feats.map(([icone, titulo]) => (
          <Card key={titulo} className="text-center">
            <Icon name={icone} size={48} className="mx-auto float" />
            <p className="font-bold mt-3">{titulo}</p>
          </Card>
        ))}
      </section>

      <section id="como" className="max-w-6xl mx-auto px-5 pb-20">
        <h2 className="text-3xl font-extrabold text-center">Como funciona</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([I, t, d], k) => (
            <Card key={t} className="shine">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-300/50">
                <I size={22} />
              </span>
              <p className="mt-4 text-xs font-bold text-slate-400">ETAPA {k + 1}</p>
              <h3 className="font-bold text-lg">{t}</h3>
              <p className="text-slate-600 mt-1">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 pb-20">
        <Card className="text-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-0 shadow-2xl shadow-indigo-300/60">
          <Icon name="coroa" size={64} className="mx-auto float" />
          <h2 className="text-2xl font-extrabold mt-3">Pronto para começar sua sequência?</h2>
          <p className="text-indigo-100 mt-2">Leva menos de um minuto. Sem cartão de crédito.</p>
          <div className="mt-5 flex justify-center">
            <Btn to="/cadastro" v="s" className="font-bold">
              Criar minha conta
            </Btn>
          </div>
        </Card>
      </section>

      <footer className="border-t border-slate-200/70 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col items-center gap-5 text-center">
          <Logo />
          <Socials />
          <p className="text-sm text-slate-500">
            OmniLearn · Estude melhor. Todos os dias. ·{' '}
            <Link to="/suporte" className="font-semibold text-indigo-600">
              Suporte
            </Link>{' '}
            ·{' '}
            <Link to="/redes" className="font-semibold text-indigo-600">
              Redes sociais
            </Link>{' '}
            ·{' '}
            <Link to="/diretrizes" className="font-semibold text-indigo-600">
              Diretrizes
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
