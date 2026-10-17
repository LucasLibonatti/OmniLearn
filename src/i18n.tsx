import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN_CORE } from './locales/en-core';
import { EN_PAGES } from './locales/en-pages';

export type Lang = 'pt' | 'en';
export type Locale = 'pt-BR' | 'en-US';

/** Traduções por texto-fonte em português (chave = string PT exata). */
const EN_ALL: Record<string, string> = { ...EN_CORE, ...EN_PAGES };

/** Idioma atual fora do React (para funções utilitárias como datas). */
let currentLang: Lang = 'pt';
export const getLang = (): Lang => currentLang;

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Traduz um texto-fonte em PT para o idioma atual (fallback: o próprio PT). */
export function tr(pt: string, vars?: Record<string, string | number>): string {
  const s = currentLang === 'en' ? EN_ALL[pt] ?? pt : pt;
  return interpolate(s, vars);
}

const LANG_KEY = 'omni-lang';

/** Detecta o idioma do navegador na primeira visita; depois usa a escolha salva. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    /* localStorage pode estar bloqueado */
  }
  const nav = (navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'pt').toLowerCase();
  return nav.startsWith('en') ? 'en' : 'pt';
}

const pt = {
  'nav.login': 'Entrar',
  'nav.start': 'Começar',
  'nav.back': 'Voltar',
  'nav.home': 'Página inicial',
  'nav.dashboard': 'Ir para o painel',
  'nav.support': 'Suporte',
  'nav.socials': 'Redes sociais',
  'nav.guidelines': 'Diretrizes',
  'theme.light': 'Usar tema claro',
  'theme.dark': 'Usar tema escuro',
  'lang.label': 'Idioma',

  'hero.badge': 'Estude 15 minutos por dia',
  'hero.title.a': 'Transforme seus materiais em um treino que ',
  'hero.title.b': 'evolui com você',
  'hero.title.c': '.',
  'hero.sub':
    'Envie seus slides e deixe a IA criar perguntas adaptadas ao seu ritmo — com sequência diária, XP e conquistas.',
  'hero.cta': 'Começar agora',
  'hero.haveAccount': 'Já tenho conta',
  'hero.trust': 'Aprenda no seu tempo, com foco no que você precisa.',
  'hero.mascotHint': 'Oi! Clique em mim.',

  'showcase.question': 'Questão {n} de {total}',
  'showcase.try': 'Clique em “Começar agora” para responder de verdade.',

  'feats.streak': 'Sequência diária',
  'feats.review': 'Revisão inteligente',
  'feats.progress': 'Evolução por assunto',
  'feats.xp': 'XP e conquistas',

  'how.title': 'Como funciona',
  'how.step': 'ETAPA {n}',
  'how.1.t': 'Envie seus materiais',
  'how.1.d': 'Adicione de 1 a 3 slides ou arquivos da matéria.',
  'how.2.t': 'A IA cria seu treino',
  'how.2.d': 'Seu conteúdo é transformado em perguntas e exercícios.',
  'how.3.t': 'Estude por 15 minutos',
  'how.3.d': 'Responda, aprenda com seus erros e evolua.',
  'how.4.t': 'Acompanhe sua evolução',
  'how.4.d': 'Veja seus pontos fortes, dificuldades e domínio estimado.',

  'cta.title': 'Pronto para começar sua sequência?',
  'cta.sub': 'Leva menos de um minuto. Sem cartão de crédito.',
  'cta.button': 'Criar minha conta',

  'footer.tagline': 'OmniLearn · Estude melhor. Todos os dias.',

  'auth.login.title': 'Bem-vindo de volta',
  'auth.signup.title': 'Comece sua jornada',
  'auth.name': 'Nome',
  'auth.email': 'E-mail',
  'auth.password': 'Senha (mínimo 6 caracteres)',
  'auth.confirm': 'Repetir senha',
  'auth.submit.login': 'Entrar',
  'auth.submit.signup': 'Criar minha conta',
  'auth.google': 'Continuar com Google',
  'auth.noAccount': 'Não possui uma conta?',
  'auth.hasAccount': 'Já tem conta?',
  'auth.createAccount': 'Criar conta',
  'auth.err.name': 'Informe seu nome.',
  'auth.err.short': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth.err.match': 'As senhas não coincidem.',
  'auth.err.login': 'E-mail ou senha incorretos.',
  'auth.done.signup': 'Conta criada! Enviamos um e-mail para você confirmar. Depois é só entrar.',

  'support.title': 'Suporte',
  'support.sub': 'Precisa de ajuda ou quer dar uma sugestão? Fale com a gente.',
  'support.sent': 'Mensagem enviada!',
  'support.sent.sub': 'Obrigado pelo contato. Vamos responder o mais rápido possível.',
  'support.again': 'Enviar outra',
  'support.name': 'Seu nome (opcional)',
  'support.name.ph': 'Como podemos te chamar?',
  'support.email': 'Seu e-mail (opcional)',
  'support.email.ph': 'Para podermos responder',
  'support.subject': 'Assunto',
  'support.subject.ph': 'Ex.: dúvida, sugestão, problema técnico…',
  'support.message': 'Mensagem',
  'support.message.ph': 'Escreva sua mensagem…',
  'support.sending': 'Enviando…',
  'support.send': 'Enviar mensagem',
  'support.socials': 'Também estamos nas redes',
  'support.seeGuidelines': 'Veja também as diretrizes.',
  'support.guidelinesLink': 'diretrizes',

  'socials.title': 'Redes sociais',
  'socials.sub': 'Acompanhe o OmniLearn e fique por dentro das novidades.',
  'socials.hint': 'Toque em uma rede para seguir — em breve os links estarão ativos.',
  'socials.instagram': 'Bastidores, dicas de estudo e novidades.',
  'socials.tiktok': 'Vídeos curtos e truques para estudar melhor.',
  'socials.youtube': 'Tutoriais e como aproveitar o OmniLearn.',
  'socials.x': 'Avisos rápidos e atualizações.',

  'legal.title': 'Diretrizes e Termos de Uso',
  'legal.updated': 'Última atualização',
  'legal.today': 'hoje',
  'legal.disclaimer':
    'Este texto é um modelo simplificado e não constitui aconselhamento jurídico. Revise com um profissional antes de usar em produção.',
  'legal.welcome':
    'Bem-vindo ao OmniLearn. Ao criar uma conta e usar o serviço, você concorda com as regras abaixo. Escrevemos tudo em linguagem simples para facilitar.',
  'legal.h.service': 'Sobre o serviço',
  'legal.p.service':
    'O OmniLearn é uma ferramenta de estudos que usa inteligência artificial para transformar os materiais que você envia (PDF ou PPTX) em perguntas e exercícios de revisão. É um apoio ao estudo, não substitui professores, livros, cursos ou orientação profissional.',
  'legal.h.acceptable': 'Uso aceitável',
  'legal.li.1': 'Você é responsável pelo conteúdo que envia e por ter o direito de usá-lo.',
  'legal.li.2':
    'Não envie dados pessoais sensíveis de terceiros nem conteúdo ilegal, ofensivo ou protegido por direitos autorais sem autorização.',
  'legal.li.3': 'Não é permitido tentar burlar limites de uso, automatizar acessos de forma abusiva ou explorar falhas do sistema.',
  'legal.li.4': 'A conta é pessoal. Não compartilhe suas credenciais.',
  'legal.h.ai': 'Conteúdo gerado por IA',
  'legal.p.ai':
    'As questões, respostas e explicações são geradas automaticamente por IA e podem conter erros. Nós não garantimos que estejam corretas, completas ou atualizadas. Confira sempre com seu material de estudo e use o bom senso.',
  'legal.h.law': 'Isenção de responsabilidade',
  'legal.p.law':
    'O OmniLearn é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por decisões, resultados acadêmicos, notas, aprovações ou quaisquer danos decorrentes do uso indevido do conteúdo gerado ou das informações exibidas.',
  'legal.h.privacy': 'Privacidade e seus dados',
  'legal.p.privacy':
    'Guardamos apenas o necessário para o funcionamento do serviço: seus dados de conta, os materiais enviados, as questões geradas e seu histórico de respostas. Você pode excluir sua conta a qualquer momento na página de perfil.',
  'legal.h.property': 'Propriedade dos materiais',
  'legal.p.property':
    'Os direitos sobre os arquivos que você envia continuam sendo seus. Ao enviar, você nos autoriza a processá-los apenas para gerar as questões e operar o serviço.',
  'legal.h.changes': 'Alterações e contato',
  'legal.p.changes':
    'Podemos atualizar estas diretrizes de tempos em tempos. Se tiver dúvidas, entre em contato pelo e-mail de suporte do projeto.',

  '404.title': 'Página não encontrada',
  '404.sub': 'O link que você abriu não existe ou foi movido. Confira o endereço ou volte para o início.',
  '404.help': 'Precisa de ajuda? Veja as diretrizes.',
} as const;

export type TKey = keyof typeof pt;

const en: Record<TKey, string> = {
  'nav.login': 'Log in',
  'nav.start': 'Get started',
  'nav.back': 'Back',
  'nav.home': 'Home',
  'nav.dashboard': 'Go to dashboard',
  'nav.support': 'Support',
  'nav.socials': 'Social media',
  'nav.guidelines': 'Guidelines',
  'theme.light': 'Use light theme',
  'theme.dark': 'Use dark theme',
  'lang.label': 'Language',

  'hero.badge': 'Study 15 minutes a day',
  'hero.title.a': 'Turn your study materials into a workout that ',
  'hero.title.b': 'grows with you',
  'hero.title.c': '.',
  'hero.sub': 'Upload your slides and let the AI build questions adapted to your pace — with daily streaks, XP and achievements.',
  'hero.cta': 'Get started',
  'hero.haveAccount': 'I already have an account',
  'hero.trust': 'Learn at your own pace, focused on what you actually need.',
  'hero.mascotHint': 'Hi! Click on me.',

  'showcase.question': 'Question {n} of {total}',
  'showcase.try': 'Hit “Get started” to answer for real.',

  'feats.streak': 'Daily streak',
  'feats.review': 'Smart review',
  'feats.progress': 'Progress by topic',
  'feats.xp': 'XP and achievements',

  'how.title': 'How it works',
  'how.step': 'STEP {n}',
  'how.1.t': 'Upload your materials',
  'how.1.d': 'Add 1–3 slides or files from your subject.',
  'how.2.t': 'AI builds your workout',
  'how.2.d': 'Your content is turned into questions and exercises.',
  'how.3.t': 'Study for 15 minutes',
  'how.3.d': 'Answer, learn from your mistakes and level up.',
  'how.4.t': 'Track your progress',
  'how.4.d': 'See your strengths, weak spots and estimated mastery.',

  'cta.title': 'Ready to start your streak?',
  'cta.sub': 'Takes less than a minute. No credit card.',
  'cta.button': 'Create my account',

  'footer.tagline': 'OmniLearn · Study better. Every day.',

  'auth.login.title': 'Welcome back',
  'auth.signup.title': 'Start your journey',
  'auth.name': 'Name',
  'auth.email': 'Email',
  'auth.password': 'Password (min. 6 characters)',
  'auth.confirm': 'Repeat password',
  'auth.submit.login': 'Log in',
  'auth.submit.signup': 'Create my account',
  'auth.google': 'Continue with Google',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.createAccount': 'Create account',
  'auth.err.name': 'Please enter your name.',
  'auth.err.short': 'The password needs at least 6 characters.',
  'auth.err.match': 'The passwords do not match.',
  'auth.err.login': 'Incorrect email or password.',
  'auth.done.signup': 'Account created! We sent you a confirmation email. Then just log in.',

  'support.title': 'Support',
  'support.sub': 'Need help or want to share an idea? Talk to us.',
  'support.sent': 'Message sent!',
  'support.sent.sub': 'Thanks for reaching out. We will reply as soon as possible.',
  'support.again': 'Send another',
  'support.name': 'Your name (optional)',
  'support.name.ph': 'What should we call you?',
  'support.email': 'Your email (optional)',
  'support.email.ph': 'So we can reply',
  'support.subject': 'Subject',
  'support.subject.ph': 'E.g. question, suggestion, technical issue…',
  'support.message': 'Message',
  'support.message.ph': 'Write your message…',
  'support.sending': 'Sending…',
  'support.send': 'Send message',
  'support.socials': 'You can also find us on social media',
  'support.seeGuidelines': 'Also see the guidelines.',
  'support.guidelinesLink': 'guidelines',

  'socials.title': 'Social media',
  'socials.sub': 'Follow OmniLearn and stay up to date.',
  'socials.hint': 'Tap a network to follow — the links will be live soon.',
  'socials.instagram': 'Behind the scenes, study tips and news.',
  'socials.tiktok': 'Short videos and tricks to study better.',
  'socials.youtube': 'Tutorials and how to get the most out of OmniLearn.',
  'socials.x': 'Quick notices and updates.',

  'legal.title': 'Guidelines and Terms of Use',
  'legal.updated': 'Last updated',
  'legal.today': 'today',
  'legal.disclaimer':
    'This text is a simplified template and is not legal advice. Have it reviewed by a professional before using it in production.',
  'legal.welcome':
    'Welcome to OmniLearn. By creating an account and using the service you agree to the rules below. We kept everything in plain language.',
  'legal.h.service': 'About the service',
  'legal.p.service':
    'OmniLearn is a study tool that uses artificial intelligence to turn the materials you upload (PDF or PPTX) into review questions and exercises. It supports your studies; it does not replace teachers, books, courses or professional guidance.',
  'legal.h.acceptable': 'Acceptable use',
  'legal.li.1': 'You are responsible for the content you upload and for having the right to use it.',
  'legal.li.2':
    "Do not upload sensitive personal data from third parties, or illegal, offensive, or copyrighted content without permission.",
  'legal.li.3': 'Do not try to bypass usage limits, abuse automated access or exploit flaws in the system.',
  'legal.li.4': 'Accounts are personal. Do not share your credentials.',
  'legal.h.ai': 'AI-generated content',
  'legal.p.ai':
    'Questions, answers and explanations are generated automatically by AI and may contain errors. We do not guarantee they are correct, complete or up to date. Always cross-check with your study materials and use common sense.',
  'legal.h.law': 'Disclaimer',
  'legal.p.law':
    'OmniLearn is provided "as is", without warranties of any kind. We are not responsible for decisions, academic results, grades, approvals or any damages arising from misuse of the generated content or the information displayed.',
  'legal.h.privacy': 'Privacy and your data',
  'legal.p.privacy':
    'We only store what the service needs: your account data, the materials you upload, the generated questions and your answer history. You can delete your account at any time from the profile page.',
  'legal.h.property': 'Ownership of materials',
  'legal.p.property':
    'The rights to the files you upload remain yours. By uploading, you authorize us to process them only to generate questions and operate the service.',
  'legal.h.changes': 'Changes and contact',
  'legal.p.changes':
    'We may update these guidelines from time to time. If you have questions, reach out through the project support email.',

  '404.title': 'Page not found',
  '404.sub': 'The link you opened does not exist or has moved. Check the address or go back home.',
  '404.help': 'Need help? See the guidelines.',
};

const DICT: Record<Lang, Record<TKey, string>> = { pt, en };
const LOCALE: Record<Lang, Locale> = { pt: 'pt-BR', en: 'en-US' };

interface I18nValue {
  lang: Lang;
  locale: Locale;
  setLang: (l: Lang) => void;
  /** Troca entre pt e en (usado pelo seletor compacto). */
  toggleLang: () => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  /** Traduz texto-fonte em PT (para strings do app interno). */
  tr: (pt: string, vars?: Record<string, string | number>) => string;
}

const I18nCtx = createContext<I18nValue>(null!);
export const useI18n = () => useContext(I18nCtx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  currentLang = lang;

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignora */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((v) => (v === 'pt' ? 'en' : 'pt')), []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      locale: LOCALE[lang],
      setLang,
      toggleLang,
      t: (key, vars) => {
        const base = DICT[lang][key] ?? key;
        return interpolate(base, vars);
      },
      tr: (pt, vars) => {
        const base = lang === 'en' ? EN_ALL[pt] ?? pt : pt;
        return interpolate(base, vars);
      },
    }),
    [lang, setLang, toggleLang],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}
