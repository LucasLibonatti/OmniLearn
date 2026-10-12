# OmniLearn — Especificação completa para construção

> Leia este arquivo inteiro antes de escrever qualquer código. Ele é a fonte da verdade do projeto.
> Responda sempre em **português do Brasil**, em linguagem simples. Quem está pedindo é **iniciante em programação**: explique o que você fez e como testar, sem jargão desnecessário.

---

## 1. O que é o produto

**OmniLearn** (antes chamado "Educação Eficiente") é uma plataforma web de estudo com IA e gamificação.
**Slogan (mantém):** "Estude melhor. Todos os dias."

Combina três ideias:
1. **NotebookLM:** o aluno envia os próprios materiais (PDF, PPTX) e o conteúdo vira exercícios.
2. **Duolingo:** rotina diária, sequência de dias, XP, níveis, conquistas e sessões curtas (~15 min).
3. **Aprendizagem adaptativa:** o sistema detecta os assuntos em que o aluno erra e mostra mais questões sobre eles, com revisão espaçada.

Não deve parecer plataforma escolar tradicional: deve parecer um app moderno, limpo e premium.

## 2. Estado atual do código (já existe, aproveite)

Já existe um protótipo funcional com **dados mockados**, em Vite + React 18 + TypeScript + Tailwind v4 + react-router-dom + lucide-react. **A estética atual deve ser mantida** (seção 4). Arquivos em `src/`:

- `main.tsx`, `App.tsx` (rotas + contexto), `index.css` (animações)
- `types.ts` (Question, Subject, Material, StudySession, UserProgress, Achievement, SessionResult)
- `data.ts` (todos os mocks: **deve deixar de ser usado**; pode ser removido no fim)
- `ui.tsx` (Card, Btn, Bar, Ring, Logo, contexto)
- `pages_public.tsx` (Landing), `AuthPage.tsx` (login/cadastro com Supabase), `auth.tsx` (AuthProvider, RequireAuth, useAuth)
- `pages_app.tsx` (Layout com sidebar/barra inferior, Dashboard, Subjects, SubjectPage, NewSubject, Configure, Result, Review, Stats, Achievements, Profile)
- `Session.tsx` (tela de exercícios, 5 tipos de questão)
- `lib/supabase.ts` (cliente Supabase usando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do `.env`)

Você pode e deve **reorganizar em pastas** (seção 5) e dividir arquivos grandes, mantendo o visual e o comportamento.

Infraestrutura já criada pelo usuário:
- Repositório no **GitHub**, site publicado na **Vercel** (deploy automático a cada push na `main`). Existe `vercel.json` com rewrite para `/index.html`.
- Projeto **Supabase** (região São Paulo) com Auth do **Google** já configurado e funcionando, e as tabelas da seção 6.1 já criadas (veja o esquema atual).
- `.env` local com as duas variáveis do Supabase; as mesmas estão na Vercel.
- Ainda **não existe**: Storage, Edge Functions, chave do Gemini, nada de IA.

## 3. Resultado esperado

Um site **completo e funcional de ponta a ponta**, sem dados mockados:

cadastro/login (e-mail ou Google) → criar matéria → enviar PDF/PPTX → texto extraído → IA (Gemini) gera questões → sessão adaptativa de ~15 min → respostas salvas → XP, sequência, nível e conquistas calculados → resultado → revisão de erros → estatísticas reais → perfil.

Tudo deve funcionar em desktop, tablet e celular, local (`npm run dev`) e na Vercel.

## 4. Identidade visual (manter exatamente a linha atual)

**Nome:** OmniLearn. Trocar em **todos** os lugares: `<title>` do `index.html`, logo (texto "OmniLearn"), landing, rodapé, textos, `package.json` (`"name": "omnilearn"`), README, metadados, mensagens de e-mail citadas no código. Buscar por "Educação Eficiente" e "educacao-eficiente" em todo o projeto e substituir (exceto o nome da pasta/repositório, que o usuário decide depois). Manter o ícone atual do logo (quadrado índigo arredondado com ícone de capelo) ou um símbolo simples equivalente.

**Estilo:** limpo, muito espaço em branco, cards arredondados (`rounded-3xl`), sombras muito sutis, animações suaves, tipografia moderna (Inter/system-ui), hierarquia visual forte. Profissional, não infantil.

**Cores (tokens que já estão em uso):**
- Fundo `#fafaf9`, texto `#0f172a` (slate-900), cards brancos com borda `slate-100`
- Primária índigo (`indigo-600`, hover `indigo-700`, fundos `indigo-50`)
- Acerto: verde (`emerald-500/50`), erro: vermelho suave (`red-300/50`)
- XP e sequência: âmbar/laranja (`amber-400/500`, `orange-100/500/600`)
- Cada matéria tem um "tom" (par fundo/texto, ex.: `bg-amber-100 text-amber-700`); ao criar matéria, sortear de uma paleta fixa de 6–8 tons.

**Componentes base reaproveitados:** `Card`, `Btn` (variantes primária/secundária), `Bar` (progresso com `role="progressbar"`), `Ring` (gauge circular SVG), `Logo`.

**Animações (moderação, respeitar `prefers-reduced-motion`):** entrada de página (`fade`), seleção/acerto (`pop`), erro (`shake`), XP flutuando (`xp`), conclusão de sessão e sequência. Nada exagerado.

**Layout:** sidebar fixa à esquerda no desktop (Início, Minhas matérias, Estatísticas, Conquistas, Perfil; avatar, nome, nível e botão Sair embaixo). No celular, barra de navegação inferior fixa. Tela de exercícios em tela cheia, sem sidebar.

**Acessibilidade:** contraste adequado, foco visível, navegação por teclado, labels em todos os campos e botões de ícone, nunca depender só de cor (usar ícones ✓/✕ e texto), `aria-live` nas mensagens de acerto/erro.

**Microcopy:** português natural e próximo ("Mandou bem!", "Boa! Você acertou.", "Quase! Vamos entender isso.", "Não deixe sua sequência quebrar!", "Vamos reforçar esse conteúdo.").

## 5. Arquitetura de código

TypeScript **estrito**, sem `any`. Componentizado e fácil de expandir. Estrutura sugerida:

```
src/
  main.tsx · App.tsx · index.css
  lib/        supabase.ts · format.ts · dates.ts (fuso America/Sao_Paulo)
  types/      domain.ts (tipos do domínio) · database.ts (linhas do banco)
  services/   subjects.ts · materials.ts · questions.ts · sessions.ts · stats.ts · profile.ts · achievements.ts · generation.ts
  engine/     adaptive.ts (seleção de questões) · xp.ts · mastery.ts
  hooks/      useSubjects, useStats, useProfile... (hooks simples com loading/erro)
  components/ ui/ (Card, Btn, Bar, Ring, Toast, Skeleton, EmptyState, ErrorState, Modal)
              layout/ (Layout, Sidebar, BottomNav)
              session/ (QuestionRenderer, MultipleChoice, TrueFalse, Fill, Match, ShortAnswer, FeedbackPanel, XpPop)
  pages/      Landing · Login · Signup · Dashboard · Subjects · SubjectDetail · NewSubject · SessionSetup ·
              Session · Result · Review · Stats · Achievements · Profile · Privacy · Terms · NotFound
  auth/       AuthProvider · RequireAuth
supabase/
  migrations/ 002_*.sql, 003_*.sql ... (SQL incremental, ver seção 6)
  functions/  generate-questions/ · delete-account/
```

Regras:
- **Nada de dados mockados.** Toda tela lê/grava via `services/*`, que falam com o Supabase. Camada de serviço isolada para facilitar trocar o backend depois.
- Bibliotecas: manter o que existe. Permitido adicionar **`pdfjs-dist`** (extrair texto de PDF no navegador) e **`jszip`** (ler PPTX). Evite outras sem necessidade; se achar uma realmente necessária, justifique antes de instalar.
- Estado: Context + hooks simples. Todo carregamento tem **skeleton**, todo erro tem mensagem amigável com "Tentar de novo", toda lista vazia tem **estado vazio** com chamada para ação.
- Rotas protegidas por `RequireAuth`; `/login` e `/cadastro` redirecionam para `/dashboard` se já logado.
- `npm run build` (inclui `tsc`) deve passar sem erros ao fim de cada fase.

## 6. Banco de dados (Supabase / PostgreSQL)

### 6.1 Esquema atual (já criado; NÃO recriar, só alterar com migrations novas)

Todas as tabelas têm **RLS ativado** com política `auth.uid() = user_id` (em `profiles`, `auth.uid() = id`):

- `profiles(id uuid pk → auth.users, name text, xp int default 0, streak int default 0, last_study_date date, created_at)`
- `subjects(id, user_id default auth.uid(), name text not null, topic text, created_at)`
- `materials(id, user_id, subject_id → subjects, file_name, storage_path, pages int, status text default 'processing', created_at)`
- `questions(id, user_id, subject_id, material_id → materials on delete set null, type check in ('multiple','tf','fill','match','short'), topic text not null, prompt text not null, options jsonb, answer text, accept jsonb, pairs jsonb, explanation text, created_at)`
- `answers(id, user_id, question_id → questions, correct boolean, xp_gained int, answered_at)`
- Trigger `on_auth_user_created` → função `handle_new_user()` cria a linha em `profiles` com o nome do Google/cadastro.

### 6.2 Migrations a criar (em `supabase/migrations/`, numeradas, idempotentes quando possível)

Escreva o SQL em arquivos e **peça ao usuário para colar no SQL Editor do Supabase** (ou usar a CLI, se ele preferir). Alterações necessárias:

1. **`subjects`:** adicionar `tone text` (classe de cor), `archived boolean default false`.
2. **`materials`:** adicionar `extracted_text text`, `char_count int`, `error_message text`; `status` com valores `'uploaded' | 'extracted' | 'generating' | 'ready' | 'error'`.
3. **`questions`:** adicionar `difficulty smallint default 2 check (difficulty between 1 and 3)`.
4. **`sessions`:** `id, user_id, subject_id, mode text check in ('smart','review','topic'), topic_filter text, planned_questions int, minutes int default 15, started_at, finished_at, correct int default 0, total int default 0, xp_gained int default 0`. RLS por `user_id`.
5. **`answers`:** adicionar `session_id uuid → sessions`, `attempt_text text` (o que o aluno respondeu), `time_ms int`, `streak_bonus boolean default false`.
6. **`question_progress`** (revisão espaçada): `user_id, question_id, box smallint default 1 (1–5), times_correct int, times_wrong int, last_answered_at, next_review_at`, PK (`user_id, question_id`). RLS por `user_id`.
7. **`achievements`** (catálogo, leitura para todos os autenticados) com seed: `first_session`, `perfect_week`, `hundred_questions`, `subject_master`, `consistent_30` (ver seção 11) + 3–5 extras à sua escolha; e **`user_achievements(user_id, achievement_id, unlocked_at)`** com RLS.
8. **`generation_log`** (limite de uso da IA): `id, user_id, material_id, created_at, status`. RLS: usuário só lê os próprios; escrita só pela Edge Function (service role).
9. **Funções SQL (RPC) com `security definer` e `set search_path = public`**, validando `auth.uid()`:
   - `start_session(subject_id, mode, topic_filter, planned)` → cria a sessão.
   - `record_answer(session_id, question_id, correct, attempt_text, time_ms)` → insere em `answers`, calcula XP no servidor (regra da seção 11), atualiza `question_progress` (caixas de Leitner) e devolve `xp_gained`/`streak_bonus`.
   - `complete_session(session_id)` → fecha a sessão, soma XP em `profiles`, **atualiza a sequência** (seção 11), avalia e concede conquistas, devolve resumo.
   - Índices em `answers(user_id, answered_at)`, `answers(session_id)`, `questions(subject_id, topic)`, `question_progress(user_id, next_review_at)`.
10. **Storage:** bucket **privado** `materials`; políticas para que cada usuário só leia/escreva/apague arquivos cujo primeiro segmento do caminho seja o próprio `auth.uid()`. Caminho: `{user_id}/{subject_id}/{uuid}-{nome-sanitizado}`.

Não exponha a `service_role` no frontend em hipótese alguma.

## 7. Autenticação

- Login com **Google** (já configurado no Supabase) e com **e-mail e senha**; cadastro com nome.
- Mensagens de erro claras em português (senha curta, e-mail já usado, "confirme seu e-mail").
- Esqueci minha senha: link em `/login` que chama `resetPasswordForEmail` e uma página `/redefinir-senha` para definir a nova senha.
- Sair (botão na sidebar). Sessão persistente. Rotas privadas protegidas.
- Perfil criado pelo gatilho; se por algum motivo não existir, criar na primeira leitura.

## 8. Telas (todas navegáveis e com dados reais)

**Rotas:** `/`, `/login`, `/cadastro`, `/redefinir-senha`, `/dashboard`, `/materias`, `/materias/nova`, `/materias/:id`, `/sessao/configurar/:subjectId`, `/sessao/:sessionId`, `/resultado/:sessionId`, `/revisao`, `/estatisticas`, `/conquistas`, `/perfil`, `/privacidade`, `/termos`, e uma página 404.

**1. Landing (pública):** manter o layout atual. Hero "Estude melhor. Todos os dias." + subtexto "Transforme seus slides e materiais em uma rotina de estudos inteligente de 15 minutos." + botões "Começar gratuitamente" e "Ver como funciona" (âncora). Prévia visual do produto (card de questão), seção "Como funciona?" com as 4 etapas (Envie seus materiais / A IA cria seu treino / Estude por 15 minutos / Acompanhe sua evolução), faixa 🔥 Sequência diária · 🧠 Revisão inteligente · 📈 Evolução por assunto · 🏆 XP e conquistas, rodapé com links Privacidade e Termos. Se já logado, o botão principal vira "Ir para o painel".

**2. Login / Cadastro:** como em `AuthPage.tsx`, com "Continuar com Google", link para esqueci a senha e estados de carregamento.

**3. Dashboard:**
- Saudação por horário ("Bom dia / Boa tarde / Boa noite, {primeiro nome} 👋") + "Pronto para estudar hoje?".
- Card de **sequência** (🔥 N dias + frase motivacional) e calendário da semana com ✓ nos dias estudados.
- Card **Sessão de hoje**: questões respondidas hoje / meta diária (18), barra de progresso, botão "Continuar sessão" (retoma sessão não finalizada) ou "Começar sessão de hoje".
- Cards das matérias (até 3, com progresso, última sessão e botão Continuar/Estudar).
- Card **Seus pontos de atenção**: até 3 assuntos com pior desempenho recente (🔴🟠🟡) + botão "Revisar agora".
- Estado vazio para usuário novo: boas-vindas e botão "Criar minha primeira matéria".

**4. Minhas matérias:** título, botão "+ Nova matéria", grade de cards (nome, assunto, nº de questões, progresso, última atividade, sequência, botão Continuar). Menu em cada card: renomear, arquivar, **excluir** (com confirmação; apaga questões, materiais e arquivos do Storage).

**5. Página da matéria:** assunto, domínio %, nº de questões, dias ativos, lista de materiais (nome, páginas, status), botão "Estudar agora", "Adicionar material" (respeitando o limite de 3 arquivos por matéria), desempenho por assunto (barras por `topic`) e botão "Gerar mais questões".

**6. Nova matéria / Upload:**
- Passo 1: campo "Nome da matéria" (ex.: "História — Revolução Francesa") e opcionalmente o assunto.
- Passo 2: área de upload (arrastar ou clicar), **até 3 arquivos, PDF ou PPTX, até 20 MB cada**. Validar tipo e tamanho com mensagens claras. Mostrar card por arquivo: nome, nº de páginas/slides, status (enviando → lendo → ✓ Pronto / erro com "Tentar de novo").
- Aviso curto e visível de privacidade: o conteúdo enviado é processado por IA (Google Gemini) para gerar as questões, e **não deve conter dados pessoais de terceiros**.
- Botão "Criar minha sessão": cria matéria, envia arquivos ao Storage, extrai texto, chama a geração e, ao terminar, vai para a configuração da sessão. Mostrar progresso honesto por etapa (sem textos falsos de "IA pensando" por tempo inútil).
- PDFs escaneados (sem texto extraível) ou PPTX sem texto: avisar claramente que não foi possível ler o conteúdo.

**7. Configuração da sessão:** "Prepare sua sessão" com matéria, conteúdo, tempo (15 min), quantidade estimada (18 questões, ajustável pelo banco disponível), modo **Aprendizado inteligente** ("As perguntas serão adaptadas ao seu desempenho"), e botão "Começar sessão". Se houver menos questões que o planejado, usar o que houver e avisar.

**8. Tela de exercícios (a mais importante):** manter o visual e o comportamento atuais.
- Topo: botão sair (com confirmação, a sessão fica salva e pode ser retomada), nome da matéria, "Questão X de N", barra de progresso, XP da sessão, cronômetro regressivo de 15:00.
- 5 tipos: múltipla escolha, verdadeiro/falso, complete a frase, associação (selects por item), resposta curta (comparação tolerante: sem acento, caixa e espaços; aceita lista `accept`).
- Ao responder: feedback imediato ("✓ Muito bem! Você acertou." / "✕ Ainda não!"), resposta correta quando errar, explicação curta, botão "Continuar"/"Entendi", animações pop/shake e **+XP flutuando**. Gravar cada resposta via `record_answer` assim que for dada (com nova tentativa em caso de falha de rede).
- Quando o cronômetro zerar: não cortar no meio; avisar e encerrar após a questão atual.
- Retomar sessão interrompida do ponto onde parou.

**9. Resultado da sessão:** 🎉 "Sessão concluída!", acertos X/N, % de acerto, +XP total, **"Sua sequência continua! 🔥"** com o número de dias e a semana, "Você mandou bem em:" (assuntos com bom desempenho), "Vale revisar:" (assuntos com erro), conquistas desbloqueadas (com animação discreta), botões "Revisar meus erros" e "Voltar ao início". Se o nível subiu, mostrar.

**10. Revisão dos erros:** "Vamos reforçar seus pontos fracos." Lista de assuntos com erros recentes (últimos 30 dias): "Você errou X de Y questões", nível (Precisa revisar / Em desenvolvimento / Quase lá), botão "Praticar" que inicia sessão `mode='topic'` naquele assunto. Estado vazio positivo se não houver erros.

**11. Estatísticas ("Sua evolução"):** cards (🔥 sequência, 🏆 XP, 📚 questões respondidas, 🎯 aproveitamento), gráfico de barras semanal (% de acerto por dia, últimos 7 dias, dias sem estudo vazios), desempenho por matéria, **Domínio estimado do conteúdo** (gauge), pontos fortes e "continue praticando".
- **Regra obrigatória de texto:** nunca chamar de probabilidade de aprovação. Usar "Domínio estimado do conteúdo" / "Índice de preparação", com a explicação: *"Este índice é baseado no seu desempenho recente, acertos, erros, dificuldade das questões e consistência dos estudos. Ele não representa uma probabilidade real de aprovação."*
- Fórmula do índice (documentar em `engine/mastery.ts`, retornando 0–100): `0,50 × acerto recente ponderado por dificuldade (últimas 100 respostas, peso maior para as mais novas) + 0,20 × cobertura (questões já respondidas ÷ total) + 0,15 × consistência (dias estudados nos últimos 14 ÷ 14) + 0,15 × retenção (proporção de questões nas caixas 4–5 do Leitner)`. Com menos de 10 respostas, exibir "Ainda coletando dados" em vez de um número enganoso.

**12. Conquistas:** grade com ícone, título, descrição e data; bloqueadas em tom discreto com cadeado e "Bloqueada". Catálogo vindo do banco.

**13. Perfil:** avatar com iniciais (ou foto do Google se existir), nome, nível, barra de XP "850 / 1000", sequência, estatísticas (questões, % acerto, nº de matérias), **Editar perfil** (nome), **Excluir minha conta e meus dados** (confirmação dupla; chama a Edge Function `delete-account`, que apaga Storage e dados e depois o usuário no Auth).

**14. Privacidade e Termos:** páginas simples e legíveis explicando quais dados são guardados, uso do Google Gemini para processar o conteúdo enviado, direito de exclusão (LGPD) e contato. Coloque um aviso visível no topo: "Texto de exemplo, deve ser revisado por um profissional jurídico antes do lançamento".

## 9. Upload e extração de texto (no navegador)

- Enviar o arquivo original ao bucket `materials` e registrar em `materials` (`status='uploaded'`).
- **PDF:** `pdfjs-dist` (worker configurado para funcionar com Vite) extrai o texto página a página; salvar `pages`, `extracted_text`, `char_count`.
- **PPTX:** `jszip` abre o arquivo; ler `ppt/slides/slideN.xml` em ordem numérica e juntar o conteúdo das tags `<a:t>`; opcionalmente notas (`ppt/notesSlides`). `pages` = nº de slides.
- Limpar o texto (espaços repetidos, hifenização de quebra de linha) e marcar `status='extracted'`. Se o texto vier vazio ou com menos de ~200 caracteres, `status='error'` com `error_message` amigável.
- Limite de texto enviado à IA: ~60.000 caracteres por matéria (se passar, truncar de forma equilibrada entre os arquivos e avisar o usuário).

## 10. Geração de questões com IA (Edge Function `generate-questions`)

**Segurança primeiro:** a chave do Gemini **nunca** vai para o frontend. Fica como *secret* da Edge Function (`GEMINI_API_KEY`); o nome do modelo fica em outro secret (`GEMINI_MODEL`) para poder trocar sem alterar código (**confirme na documentação oficial do Gemini qual é o modelo Flash atual e disponível no plano gratuito**; não presuma). O usuário vai criar a chave em aistudio.google.com e rodar o comando de secret; **peça a ele isso na hora certa e nunca peça para colar a chave no chat**.

Fluxo da função:
1. Receber `material_ids` (ou `subject_id`) e `quantity` (padrão 30–40 questões por matéria).
2. Validar o JWT do usuário (cliente Supabase com o header `Authorization` da requisição) e **conferir que os materiais pertencem a ele**.
3. **Limite de uso:** consultar `generation_log` e recusar com mensagem amigável se passar de N gerações por usuário por dia (padrão 5, configurável por secret). Registrar cada chamada.
4. Marcar materiais `status='generating'`.
5. Chamar a API do Gemini com **saída estruturada em JSON** (`responseMimeType: application/json` + `responseSchema`), prompt em PT-BR. Pedir: questões **baseadas exclusivamente no material enviado**, sem inventar fatos, com explicação curta, assunto (`topic`) coerente (3–8 assuntos por matéria, nomes curtos e reutilizados), dificuldade 1–3 e mistura dos 5 tipos (~40% múltipla escolha, 20% V/F, 15% completar, 10% associação, 15% resposta curta).
6. **Validar cada questão no servidor** antes de salvar e descartar as inválidas: `multiple` com 4 opções e `answer` ∈ opções; `tf` com opções `['Verdadeiro','Falso']`; `fill` com `____` no enunciado, 4 opções e resposta ∈ opções; `match` com 3–4 pares; `short` com `accept` (lista em minúsculas, sem acento) e `answer` de exibição; `explanation` obrigatória; sem duplicatas.
7. Inserir em `questions` (com `user_id`, `subject_id`, `material_id`) e marcar materiais `status='ready'`. Em falha: `status='error'` + `error_message`, resposta com erro claro (429/cota → "muitas gerações agora, tente em alguns minutos").
8. Tratar timeouts (dividir o texto em blocos e gerar por partes se necessário). Não registrar o conteúdo do material nos logs.
9. CORS correto para o domínio da Vercel e `localhost:5173`.

O frontend chama com `supabase.functions.invoke('generate-questions', …)` e mostra o progresso. Também exponha **"Gerar mais questões"** na página da matéria (respeitando o limite diário).

## 11. Regras de gamificação e adaptação (implementar no servidor via RPC)

**XP:** acerto **+10**; erro **+3**; **bônus +5** em acertos a partir do 3º acerto consecutivo dentro da sessão. Persistir `xp_gained` e `streak_bonus` por resposta.

**Nível:** 1000 XP por nível. `nível = floor(xp_total / 1000) + 1`; a barra mostra `xp_total mod 1000` de 1000.

**Sequência (streak):** conta 1 dia quando o aluno **conclui ao menos uma sessão** (ou responde ≥ 5 questões) no dia, usando o fuso **America/Sao_Paulo**. Se `last_study_date` = ontem → `streak + 1`; = hoje → mantém; mais antigo → volta para 1. Atualizar em `complete_session`. No dashboard, se a sequência vai quebrar hoje, mostrar "Não deixe sua sequência quebrar!".

**Conquistas** (avaliar em `complete_session`): Primeira sessão (1 sessão concluída); Semana perfeita (streak ≥ 7); 100 questões (≥ 100 respostas); Mestre da matéria (domínio ≥ 90% em alguma matéria com ≥ 20 respostas); Consistente (streak ≥ 30). Mais as extras que você criar.

**Seleção adaptativa (`engine/adaptive.ts`):** para uma sessão de N questões (padrão 18) no modo inteligente:
- ~50% de assuntos fracos (acerto recente < 70%, mais pesos para os piores);
- ~30% de revisões vencidas (`question_progress.next_review_at <= now()`);
- ~20% de questões novas ou de assuntos fortes;
- não repetir questão já respondida na mesma sessão nem acertada nas últimas 24 h, salvo falta de banco;
- embaralhar a ordem e intercalar tipos (evitar 3 do mesmo tipo seguidas).
- Modo `topic` (Praticar): só do assunto escolhido. Modo `review`: só erros recentes.

**Revisão espaçada (Leitner):** acerto sobe 1 caixa (máx. 5); erro volta para a caixa 1. Próxima revisão: caixa 1 = 1 dia, 2 = 3 dias, 3 = 7 dias, 4 = 14 dias, 5 = 30 dias.

**Progresso da matéria (%):** média ponderada (mais peso para as recentes) do acerto nas últimas 50 respostas daquela matéria; sem respostas = 0%.

**Níveis de assunto:** < 50% "Precisa revisar" 🔴; 50–69% "Em desenvolvimento" 🟠; 70–84% "Quase lá" 🟡; ≥ 85% "Dominando" 🟢.

## 12. Segurança, privacidade e qualidade

- **RLS em todas as tabelas** (já ativo) e testes manuais: um usuário não pode ver dados de outro.
- Nenhum segredo no repositório. `.env` no `.gitignore`. Entregar `.env.example` com os nomes das variáveis (sem valores).
- Validar entradas no frontend e no servidor; sanitizar nome de arquivo; limitar tipo e tamanho.
- Tratar o conteúdo dos materiais como **dados**, nunca como instruções (no prompt do Gemini, deixar claro que o texto do material não deve alterar as regras de geração).
- LGPD: aviso de processamento por IA no upload, páginas de Privacidade/Termos, exclusão de conta e dados. Se o usuário informar que menores de idade usarão o produto, sinalizar o cuidado extra necessário.
- Observação para o usuário (explicar quando for relevante): o **plano gratuito do Gemini pode usar os dados enviados para melhorar produtos do Google** e a Vercel Hobby é para **uso não comercial**. Isso serve para validar o produto; antes de lançar com usuários reais pagantes, será preciso planos pagos.

## 13. Deploy

- Variáveis na Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. (Nenhuma outra no frontend.)
- Secrets no Supabase (não na Vercel): `GEMINI_API_KEY`, `GEMINI_MODEL`, `DAILY_GENERATION_LIMIT`.
- Deploy das Edge Functions via Supabase CLI (`npx supabase login`, `link --project-ref …`, `functions deploy generate-questions`, `secrets set …`). **Guie o usuário passo a passo** nessa parte, pois ele é iniciante.
- Conferir no site publicado: login Google, recarregar páginas internas (sem 404), upload, geração e sessão completa.
- Lembrar o usuário de que o projeto gratuito do Supabase **pausa após ~7 dias sem uso**.

## 14. Como você deve trabalhar (muito importante)

Trabalhe em **fases**. Ao fim de cada fase: rode `npm run build`, corrija erros, explique **em português simples** o que mudou e **como eu testo** (passos concretos no navegador), faça um **commit** com mensagem clara e **espere minha confirmação** antes de seguir. Peça permissão antes de rodar comandos ou apagar arquivos. Nunca invente que testou algo que não rodou.

**Fase 0 — Renomear e organizar:** trocar o nome para OmniLearn em todo o projeto, reorganizar pastas, criar `.env.example`, garantir que o build passa e o visual continua igual.
**Fase 1 — Banco:** escrever as migrations (seção 6) e me orientar a executá-las; criar bucket e políticas; tipos TypeScript do banco.
**Fase 2 — Camada de dados e autenticação completa:** `services/*`, perfil real, esqueci a senha, sair, rotas protegidas, remover dependência dos mocks no layout/perfil.
**Fase 3 — Matérias e dashboard reais:** CRUD de matérias, cards, dashboard com dados reais e estados vazios/carregando/erro.
**Fase 4 — Upload e extração:** Storage, PDF e PPTX, status por arquivo, tela de nova matéria completa.
**Fase 5 — IA:** Edge Function `generate-questions`, secrets, limite diário, validação, integração no frontend. Me guie para criar a chave do Gemini e fazer o deploy.
**Fase 6 — Sessão adaptativa:** RPCs (`start_session`, `record_answer`, `complete_session`), motor adaptativo, tela de exercícios com salvamento e retomada, resultado, revisão de erros.
**Fase 7 — Estatísticas, conquistas e perfil reais:** gráfico semanal, domínio estimado, conquistas, editar perfil, excluir conta.
**Fase 8 — Acabamento:** Privacidade/Termos, 404, acessibilidade (teclado, foco, aria), responsividade em 360 px / tablet / desktop, animações, otimização, deploy final na Vercel e checklist de testes.

## 15. Critérios de pronto

- [ ] Nenhum arquivo importa de `data.ts` e nenhum texto "Educação Eficiente" restou.
- [ ] Cadastro, login por e-mail e Google, esqueci a senha e sair funcionam, local e na Vercel.
- [ ] Criar matéria → enviar PDF/PPTX → questões geradas → sessão de 15 min → resultado → revisão, tudo com dados reais.
- [ ] XP, nível, sequência e conquistas calculados no servidor e batendo com as regras da seção 11.
- [ ] Questões adaptam ao desempenho (assuntos com mais erros aparecem mais).
- [ ] Estatísticas e domínio estimado vêm do banco, com o aviso de que não é probabilidade de aprovação.
- [ ] RLS impede acesso cruzado entre usuários; chaves secretas fora do frontend e do Git.
- [ ] Estados de carregando, vazio e erro em todas as telas; funciona em celular, tablet e desktop; navegável por teclado.
- [ ] `npm run build` sem erros; site na Vercel funcionando, sem 404 ao recarregar.
- [ ] README em português com: o que é, como rodar, variáveis de ambiente, como fazer deploy e arquitetura.

**Comece agora pela Fase 0.** Antes de alterar qualquer coisa, leia o projeto, me diga em poucas frases o que encontrou e o que vai fazer na Fase 0.
