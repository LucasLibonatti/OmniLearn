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
  'showcase.hint': 'Teste agora — clique em uma alternativa',
  'showcase.correct': 'Acertou! +10 XP',
  'showcase.wrong': 'Quase! Veja a explicação:',
  'showcase.next': 'Próxima questão',
  'showcase.finish': 'Ver resultado do teste',
  'showcase.done.title': 'Mandou bem! Você ganhou +{xp} XP',
  'showcase.done.sub': 'Você acertou {score} de {total} questões. Crie sua conta grátis para treinar com seus próprios PDFs e slides.',
  'showcase.replay': 'Testar de novo',

  'preview.eyebrow': 'POR DENTRO DA PLATAFORMA',
  'preview.title': 'Tudo o que você precisa para estudar em 15 minutos',
  'preview.sub': 'Sem distrações: seus materiais viram trilhas, flashcards e métricas claras de domínio.',
  'preview.tab.dashboard': 'Painel & Ofensiva',
  'preview.tab.ai': 'PDF → IA',
  'preview.tab.flashcards': 'Flashcards & Domínio',
  'preview.flip': 'Clique no card para virar',
  'preview.flipped': 'Resposta revelada · Caixa 3 de 5 (revisão em 7 dias)',

  'feats.streak': 'Sequência diária',
  'feats.review': 'Revisão inteligente',
  'feats.progress': 'Evolução por assunto',
  'feats.xp': 'XP e conquistas',

  'how.title': 'Como funciona',
  'how.step': 'ETAPA {n}',
  'how.1.t': 'Envie seus materiais',
  'how.1.d': 'Envie um PDF, PPTX ou cole o texto da matéria.',
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
  'auth.err.terms': 'Você deve aceitar os Termos de Uso para continuar.',
  'auth.err.privacy': 'Você deve aceitar a Política de Privacidade para continuar.',
  'auth.done.signup': 'Conta criada! Enviamos um e-mail para você confirmar. Depois é só entrar.',
  'auth.terms.1': 'Li e aceito os ',
  'auth.terms.2': 'Termos de Uso',
  'auth.terms.3': '.',
  'auth.privacy.1': 'Li e aceito a ',
  'auth.privacy.2': 'Política de Privacidade',
  'auth.privacy.3': '.',
  'upload.warning.title': 'Envie apenas materiais de estudo',
  'upload.warning.short': 'Não inclua documentos pessoais (CPF, RG), dados sensíveis ou informações de terceiros.',
  'upload.warning.more': 'Saiba mais',
  'upload.warning.less': 'Ocultar detalhes',
  'upload.warning.details':
    'O texto extraído é processado por IA de terceiros (Groq / Llama 3.3) para gerar suas questões e resumos — o arquivo PDF/PPTX original não fica salvo na nuvem. É proibido enviar documentos oficiais (CPF, RG, CNH, passaporte), dados de saúde, bancários, biométricos, genéticos, origem racial/étnica, convicção religiosa, opinião política, filiação sindical, vida sexual, dados de terceiros sem consentimento ou material com direitos autorais sem autorização.',
  'upload.warning.link': 'Ver Diretrizes e Privacidade',

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
  'support.seeGuidelines': 'Veja também as diretrizes.',
  'support.guidelinesLink': 'diretrizes',

  'legal.title': 'Diretrizes e Termos de Uso',
  'legal.updated': 'Última atualização',
  'legal.today': 'Novembro de 2026',
  'legal.disclaimer':
    'OmniLearn é um projeto educacional open-source (MIT) em conformidade com os princípios da LGPD.',
  'legal.welcome':
    'Bem-vindo ao OmniLearn. Ao criar uma conta e usar o serviço, você concorda com as regras abaixo. Escrevemos tudo em linguagem simples para facilitar.',
  'legal.h.service': 'Sobre o serviço',
  'legal.p.service':
    'O OmniLearn é uma ferramenta de estudos que usa inteligência artificial para transformar os materiais que você envia (PDF ou PPTX) em perguntas e exercícios de revisão. É um apoio ao estudo, não substitui professores, livros, cursos ou orientação profissional.',
  'legal.h.acceptable': 'Uso aceitável',
  'legal.li.1': 'Você é responsável pelo conteúdo que envia e por ter o direito de usá-lo.',
  'legal.li.2':
    'É **expressamente proibido** enviar: (a) **dados pessoais sensíveis** (Art. 5º, II e Art. 11 da LGPD): saúde, biometria, origem racial/étnica, convicção religiosa, opinião política, filiação sindical, vida sexual, dados genéticos, **documentos oficiais (CPF, RG, CNH, passaporte)**, dados financeiros/bancários; (b) dados de terceiros sem consentimento; (c) conteúdo protegido por direitos autorais sem autorização; (d) conteúdo ilegal ou ofensivo.',
  'legal.li.3': 'Não é permitido tentar burlar limites de uso, automatizar acessos de forma abusiva ou explorar falhas do sistema.',
  'legal.li.4': 'A conta é pessoal. Não compartilhe suas credenciais.',
  'legal.h.ai': 'Conteúdo gerado por IA',
  'legal.p.ai':
    'As questões, respostas e explicações são geradas automaticamente por IA e podem conter erros. Nós não garantimos que estejam corretas, completas ou atualizadas. Confira sempre com seu material de estudo e use o bom senso.',
  'legal.h.law': 'Isenção de responsabilidade e natureza do projeto',
  'legal.p.law':
    'O OmniLearn é um projeto **experimental, acadêmico e de portfólio**, **sem fins lucrativos**, fornecido **"no estado em que se encontra" (as-is)**, sem garantias de qualquer natureza — expressas ou implícitas. Isso inclui, mas não se limita a: disponibilidade contínua (sujeito a pausas de infraestrutura gratuita), guarda permanente de arquivos enviados, correção ou atualização do conteúdo gerado por IA. Não nos responsabilizamos por decisões, resultados acadêmicos, notas, aprovações ou quaisquer danos decorrentes do uso indevido do conteúdo gerado ou das informações exibidas. O processamento de IA é realizado por terceiros e pode conter imprecisões, alucinações ou erros factuais; o usuário assume todo risco pelo uso do conteúdo gerado.',
  'legal.h.privacy': 'Privacidade e seus dados',
  'legal.p.privacy':
    'Guardamos apenas o necessário para o funcionamento do serviço: seus dados de conta, os materiais enviados, as questões geradas e seu histórico de respostas. Você pode excluir sua conta a qualquer momento na página de perfil.',
  'legal.h.transfer': 'Transferência internacional e subprocessadores (Art. 33 LGPD)',
  'legal.p.transfer':
    'Ao usar o OmniLearn, seus dados pessoais e o conteúdo que você envia são processados por **serviços terceiros** localizados fora do Brasil. Os subprocessadores atuais são:\n\n• **Groq Inc. (EUA)** — inferência de IA (modelo Llama 3.3 da Meta) para gerar questões, resumos e explicações.\n• **Neon Inc. (EUA)** — banco de dados PostgreSQL serverless (dados de conta, matérias, texto extraído e histórico de estudos).\n• **Vercel Inc. (EUA)** — hospedagem web e funções serverless da API.\n• **Google LLC (EUA)** — apenas se você optar por entrar com "Continuar com Google" (OAuth 2.0).\n\n**Minimização de dados (Art. 6º, III LGPD):** seus arquivos PDF e PPTX são lidos localmente no seu navegador — nunca armazenamos o arquivo binário original na nuvem, apenas o texto extraído necessário para gerar as questões.\n\n**Base legal para transferência (Art. 33 LGPD):** a transferência baseia-se em **cláusulas contratuais padrão (SCCs)** firmadas com cada subprocessador e no **consentimento expresso** registrado na sua conta.',
  'legal.h.property': 'Propriedade dos materiais',
  'legal.p.property':
    'Os direitos sobre os arquivos que você envia continuam sendo seus. Ao enviar, você nos autoriza a processá-los apenas para gerar as questões e operar o serviço.',
  'legal.h.changes': 'Direitos do titular (Art. 18 LGPD) e contato',
  'legal.p.changes':
    'Você pode exportar todos os seus dados em JSON ou excluir permanentemente sua conta e todos os dados associados a qualquer momento na página de **Perfil**. Para dúvidas ou solicitações de privacidade, utilize nossa página de Suporte.',

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
  'showcase.hint': 'Try it now — click an option',
  'showcase.correct': 'Correct! +10 XP',
  'showcase.wrong': 'Not quite! See why:',
  'showcase.next': 'Next question',
  'showcase.finish': 'See quiz result',
  'showcase.done.title': 'Nice work! You earned +{xp} XP',
  'showcase.done.sub': 'You got {score} of {total} right. Create your free account to train with your own PDFs and slides.',
  'showcase.replay': 'Try again',

  'preview.eyebrow': 'INSIDE THE PLATFORM',
  'preview.title': 'Everything you need to study in 15 minutes',
  'preview.sub': 'Zero clutter: your materials turn into quizzes, spaced-repetition flashcards and clear mastery stats.',
  'preview.tab.dashboard': 'Dashboard & Streak',
  'preview.tab.ai': 'PDF → AI',
  'preview.tab.flashcards': 'Flashcards & Mastery',
  'preview.flip': 'Click card to flip',
  'preview.flipped': 'Answer revealed · Box 3 of 5 (review in 7 days)',

  'feats.streak': 'Daily streak',
  'feats.review': 'Smart review',
  'feats.progress': 'Progress by topic',
  'feats.xp': 'XP and achievements',

  'how.title': 'How it works',
  'how.step': 'STEP {n}',
  'how.1.t': 'Upload your materials',
  'how.1.d': 'Upload a PDF, PPTX or paste your study text.',
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
  'auth.err.terms': 'You must accept the Terms of Use to continue.',
  'auth.err.privacy': 'You must accept the Privacy Policy to continue.',
  'auth.done.signup': 'Account created! We sent you a confirmation email. Then just log in.',
  'auth.terms.1': 'I have read and accept the ',
  'auth.terms.2': 'Terms of Use',
  'auth.terms.3': '.',
  'auth.privacy.1': 'I have read and accept the ',
  'auth.privacy.2': 'Privacy Policy',
  'auth.privacy.3': '.',
  'upload.warning.title': 'Upload study materials only',
  'upload.warning.short': 'Do not include personal documents (IDs), sensitive data or third-party information.',
  'upload.warning.more': 'Learn more',
  'upload.warning.less': 'Hide details',
  'upload.warning.details':
    'Extracted study text is processed by third-party AI (Groq / Llama 3.3) to generate questions and summaries — the raw PDF/PPTX file is never stored in the cloud. Uploading official IDs (CPF, RG, passport), health, banking, biometric, genetic, racial/ethnic, religious, political, union or sex-life data, third-party data without consent, or unauthorized copyrighted material is prohibited.',
  'upload.warning.link': 'View Guidelines & Privacy',

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
  'support.seeGuidelines': 'Also see the guidelines.',
  'support.guidelinesLink': 'guidelines',

  'legal.title': 'Guidelines and Terms of Use',
  'legal.updated': 'Last updated',
  'legal.today': 'November 2026',
  'legal.disclaimer':
    'OmniLearn is an open-source educational project (MIT) designed in alignment with LGPD data protection principles.',
  'legal.welcome':
    'Welcome to OmniLearn. By creating an account and using the service you agree to the rules below. We kept everything in plain language.',
  'legal.h.service': 'About the service',
  'legal.p.service':
    'OmniLearn is a study tool that uses artificial intelligence to turn the materials you upload (PDF or PPTX) into review questions and exercises. It supports your studies; it does not replace teachers, books, courses or professional guidance.',
  'legal.h.acceptable': 'Acceptable use',
  'legal.li.1': 'You are responsible for the content you upload and for having the right to use it.',
  'legal.li.2':
    'It is **expressly prohibited** to upload: (a) **sensitive personal data** (LGPD Art. 5º II, Art. 11): health, biometrics, racial/ethnic origin, religious belief, political opinion, union membership, sex life, genetic data, **official documents (CPF, RG, CNH, passport)**, financial/banking data; (b) third-party data without consent; (c) copyrighted content without permission; (d) illegal or offensive content.',
  'legal.li.3': 'Do not try to bypass usage limits, abuse automated access or exploit flaws in the system.',
  'legal.li.4': 'Accounts are personal. Do not share your credentials.',
  'legal.h.ai': 'AI-generated content',
  'legal.p.ai':
    'Questions, answers and explanations are generated automatically by AI and may contain errors. We do not guarantee they are correct, complete or up to date. Always cross-check with your study materials and use common sense.',
  'legal.h.law': 'Disclaimer and project nature',
  'legal.p.law':
    'OmniLearn is an **experimental, academic and portfolio project**, **non-profit**, provided **"as is"**, without warranties of any kind — express or implied. This includes, but is not limited to: continuous availability (subject to free infrastructure downtime), permanent storage of uploaded files, correction or updating of AI-generated content. We are not responsible for decisions, academic results, grades, approvals or any damages arising from misuse of the generated content or the information displayed. AI processing is performed by third parties and may contain inaccuracies, hallucinations or factual errors; the user assumes all risk from using the generated content.',
  'legal.h.privacy': 'Privacy and your data',
  'legal.p.privacy':
    'We only store what the service needs: your account data, the materials you upload, the generated questions and your answer history. You can delete your account at any time from the profile page.',
  'legal.h.transfer': 'International transfer and subprocessors (Art. 33 LGPD)',
  'legal.p.transfer':
    'By using OmniLearn, your personal data and study text are processed by **third-party services** located outside Brazil. Current subprocessors:\n\n• **Groq Inc. (USA)** — AI inference (Meta\'s Llama 3.3 model) to generate questions, summaries and explanations.\n• **Neon Inc. (USA)** — serverless PostgreSQL database (account data, subjects, extracted text and study history).\n• **Vercel Inc. (USA)** — web hosting and serverless API functions.\n• **Google LLC (USA)** — only if you choose to sign in with Google (OAuth 2.0).\n\n**Data minimization (LGPD Art. 6 III):** your PDF and PPTX files are extracted locally in your browser — we never store the raw binary file in the cloud, only the extracted study text needed to generate questions.\n\n**Legal basis for transfer (Art. 33 LGPD):** based on **standard contractual clauses (SCCs)** with each subprocessor and your **explicit consent** recorded on your account.',
  'legal.h.property': 'Ownership of materials',
  'legal.p.property':
    'The rights to the files you upload remain yours. By uploading, you authorize us to process them only to generate questions and operate the service.',
  'legal.h.changes': 'Data subject rights (LGPD Art. 18) and contact',
  'legal.p.changes':
    'You can export all of your data as JSON or permanently delete your account and all associated records at any time from your **Profile** page. For privacy questions or requests, please reach out through our Support page.',

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

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      locale: LOCALE[lang],
      setLang,
      t: (key, vars) => {
        const base = DICT[lang][key] ?? key;
        return interpolate(base, vars);
      },
      tr: (pt, vars) => {
        const base = lang === 'en' ? EN_ALL[pt] ?? pt : pt;
        return interpolate(base, vars);
      },
    }),
    [lang, setLang],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}
