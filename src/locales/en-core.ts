/** Traduções EN para módulos centrais (datas, estados, sessão). Chave = texto PT exato. */
export const EN_CORE: Record<string, string> = {
  // lib/dates.ts
  DOM: 'SUN',
  SEG: 'MON',
  TER: 'TUE',
  QUA: 'WED',
  QUI: 'THU',
  SEX: 'FRI',
  SÁB: 'SAT',
  Hoje: 'Today',
  Ontem: 'Yesterday',
  'Há {n} dias': '{n} days ago',
  'Bom dia': 'Good morning',
  'Boa tarde': 'Good afternoon',
  'Boa noite': 'Good evening',

  // components/states.tsx
  'Geralmente leva de 30s a 2 minutos. Não feche esta página.':
    "It usually takes 30 seconds to 2 minutes. Don't close this page.",
  '{pct}% concluído': '{pct}% complete',
  'Algo deu errado': 'Something went wrong',
  'Tentar de novo': 'Try again',

  // Session.tsx
  'Sessão não encontrada.': 'Session not found.',
  'Erro ao carregar a sessão.': 'Failed to load the session.',
  'Não conseguimos salvar sua resposta. Confira sua internet e tente novamente.':
    "We couldn't save your answer. Check your connection and try again.",
  'Erro ao concluir a sessão.': 'Failed to finish the session.',
  'Carregando a sessão…': 'Loading the session…',
  'Você já respondeu todas as questões desta sessão.':
    'You have already answered every question in this session.',
  'Concluindo…': 'Finishing…',
  'Ver resultado': 'See results',
  'Sair da sessão': 'Leave session',
  'Sair? Sua sessão fica salva e você pode continuar depois.':
    'Leave? Your session is saved and you can continue later.',
  'Modo prova': 'Exam mode',
  Sessão: 'Session',
  'Questão {n} de {total}': 'Question {n} of {total}',
  Verificar: 'Check',
  'Sua resposta': 'Your answer',
  'Digite sua resposta': 'Type your answer',
  'Resposta registrada.': 'Answer recorded.',
  'No modo prova você vê o resultado só no final.': 'In exam mode you only see the result at the end.',
  Continuar: 'Continue',
  'Muito bem! Você acertou.': 'Well done! You got it right.',
  'Ainda não!': 'Not quite!',
  'Resposta correta: ': 'Correct answer: ',
  'Pensando…': 'Thinking…',
  'Explique de novo': 'Explain again',
  'Explicação da IA': 'AI explanation',
  Entendi: 'Got it',
  'O tempo acabou — responda esta questão (a última) e vamos encerrar.':
    "Time's up — answer this (the last) question and we'll wrap up.",

  // ui.tsx
  'Escolha…': 'Choose…',

  // services/ai.ts
  'Não foi possível gerar o resumo agora.': "We couldn't generate the summary right now.",
  'Não foi possível gerar a explicação agora.': "We couldn't generate the explanation right now.",

  // services/support.ts
  'Escreva um pouco mais sobre o que você precisa.': 'Write a little more about what you need.',
  'Não foi possível enviar sua mensagem. Tente novamente mais tarde.':
    "We couldn't send your message. Try again later.",

  // lib/api.ts
  'Não foi possível concluir a operação agora.': "We couldn't complete this action right now.",

  // lib/extract.ts
  'Formato não suportado. Envie PDF ou PPTX.': 'Unsupported format. Upload a PDF or PPTX.',

  // services/stats.ts
  Geral: 'General',
  'Precisa revisar': 'Needs review',
  'Em desenvolvimento': 'Developing',
  'Quase lá': 'Almost there',
  Dominando: 'Mastering',

  // components/ErrorBoundary.tsx
  'Ops, algo inesperado aconteceu': 'Oops, something unexpected happened',
  'Seus dados estão seguros. Recarregue a página ou volte para o início para continuar estudando.':
    'Your data is safe. Reload the page or return to the home screen to keep studying.',
  'Recarregar página': 'Reload page',
  'Ir para o início': 'Go to home',
};
