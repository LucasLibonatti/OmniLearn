# 🎓 OmniLearn — Educação Eficiente com IA

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

> **OmniLearn (Educação Eficiente)** é uma plataforma web de aprendizagem assistida por Inteligência Artificial que transforma documentos e conteúdos estáticos em experiências de estudo interativas, personalizadas e gamificadas.

🔗 **Aplicação em Produção (Live Demo):** [https://educacao-eficiente.vercel.app/](https://educacao-eficiente.vercel.app/)

## 🎯 Sobre o Projeto

O estudo tradicional baseado apenas na leitura passiva de documentos e apostilas costuma resultar em baixa retenção de conhecimento e queda rápida de engajamento.

O **OmniLearn** resolve esse problema combinando **inferência de linguagem natural de ultrabaixa latência (Groq API)** com **mecânicas de gamificação**. A plataforma permite que estudantes conversem diretamente com seus materiais de estudo, gerem resumos estruturados, pratiquem com quizzes e flashcards criados sob demanda pela IA e acompanhem sua evolução em tempo real.

## ✨ Funcionalidades Principais

* 📄 **Tutoria Inteligente Contextualizada:** Análise de materiais e textos para responder dúvidas, simplificar conceitos complexos e extrair tópicos essenciais.
* 🎮 **Aprendizado Gamificado:** Geração dinâmica de quizzes, flashcards e desafios práticos baseados no conteúdo estudado para estimular a recordação ativa (*active recall*).
* ⚡ **Respostas em Tempo Real:** Integração com a **Groq API** utilizando o modelo `llama-3.3-70b-versatile`, entregando respostas em frações de segundo (`<500ms`) sem interromper o ritmo de estudo.
* 🔐 **Autenticação e Persistência Segura:** Gestão de usuários, sessões e histórico de progresso via **Supabase (PostgreSQL)**, com proteção de dados em nível de linha (*Row Level Security - RLS*) e adequação às diretrizes da LGPD.
* 📱 **Interface Responsiva e Moderna:** Design focado em usabilidade, leitura confortável e navegação fluida tanto em desktop quanto em dispositivos móveis.

## 🛠️ Stack Tecnológica

### Frontend
* **React + Vite:** Arquitetura de componentes modular com *Hot Module Replacement (HMR)* e bundle otimizado para produção.
* **TypeScript:** Tipagem estática ponta a ponta para garantir segurança de dados, autocompletar inteligente e manutenibilidade.
* **Tailwind CSS:** Estilização utilitária para construção rápida de uma interface limpa, consistente e responsiva.

### Backend (BaaS) & Inteligência Artificial
* **Supabase:** Banco de dados relacional **PostgreSQL** gerenciado na nuvem, autenticação completa (*Supabase Auth*) e políticas de segurança (*RLS*).
* **Groq API:** Motor de inferência LPU (*Language Processing Unit*) executando o modelo `llama-3.3-70b-versatile` para geração de trilhas, quizzes e chat pedagógico.

### Infraestrutura & Deploy
* **Vercel:** Pipeline de CI/CD automatizado integrado ao GitHub com deploy contínuo a cada push na branch principal.
* **Git & GitHub:** Versionamento semântico e organização de código.

## 🧠 Decisões de Arquitetura

1. **Por que Groq API (`llama-3.3-70b-versatile`) na camada de IA?**
   Em plataformas educacionais gamificadas, a velocidade de resposta da IA impacta diretamente a experiência do usuário. A escolha da Groq permitiu gerar quizzes e feedbacks quase instantâneos, mantendo o estado de foco (*flow*) do estudante.
2. **Arquitetura Serverless com BaaS (Supabase):**
   A adoção do Supabase como backend unificado (PostgreSQL + Auth + RLS) elimina a sobrecarga de manter servidores intermediários, garante paridade entre os ambientes de desenvolvimento e produção e reduz a fricção para novos desenvolvedores rodarem o projeto.
3. **Privacidade by Design (Conformidade LGPD):**
   Coleta mínima de dados estritamente necessários para a autenticação e histórico de aprendizado, com isolamento total de registros por usuário diretamente nas políticas do banco de dados.

## 🚀 Como Executar Localmente

### Pré-requisitos
* [Node.js 20+](https://nodejs.org/)
* [Git](https://git-scm.com/)
* Conta gratuita no [Supabase](https://supabase.com/) e chave de API na [Groq Cloud](https://console.groq.com/)

### 1. Clonar o repositório

```bash
git clone https://github.com/LucasLibonatti/OmniLearn.git
cd OmniLearn
```

### 2. Configurar as Variáveis de Ambiente

Copie o arquivo de exemplo para criar o seu `.env` local:

```bash
cp .env.example .env
```

Preencha as chaves no arquivo `.env` conforme a tabela abaixo:

| Variável | Obrigatória | Onde Obter | Finalidade |
| :--- | :---: | :--- | :--- |
| `VITE_GROQ_API_KEY` | Sim | [Groq Console](https://console.groq.com/) | Inferência de IA (tutoria, quizzes e flashcards) |
| `VITE_SUPABASE_URL` | Sim | [Supabase Dashboard](https://supabase.com/dashboard) | Endpoint REST/Realtime do banco PostgreSQL |
| `VITE_SUPABASE_ANON_KEY` | Sim | Supabase (Settings → API) | Chave pública anônima para autenticação e RLS |

Exemplo de arquivo `.env`:

```env
VITE_GROQ_API_KEY=gsk_sua_chave_aqui
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Instalar dependências e iniciar o servidor

```bash
# Instalar pacotes
npm install

# Iniciar ambiente de desenvolvimento (Vite)
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR na porta `5173` |
| `npm run build` | Compila o TypeScript e gera o build otimizado de produção na pasta `dist/` |
| `npm run preview` | Executa localmente o build de produção na porta `4173` para validação |

## 📂 Estrutura do Projeto

```text
OmniLearn/
├── public/                  # Ativos estáticos públicos
├── src/
│   ├── components/          # Componentes reutilizáveis de UI e mecânicas de gamificação
│   ├── pages/               # Telas e rotas principais da plataforma
│   ├── services/            # Clientes de integração externa (Supabase e Groq API)
│   ├── hooks/               # Custom hooks para gestão de estado e sessão de estudo
│   ├── types/               # Interfaces e contratos de dados em TypeScript
│   ├── utils/               # Funções auxiliares e formatadores
│   ├── styles/              # Estilos globais e diretivas do Tailwind CSS
│   ├── App.tsx              # Componente raiz e configuração de rotas
│   └── main.tsx             # Ponto de entrada e bootstrap do React
├── .env.example             # Template de variáveis de ambiente
├── index.html               # Documento HTML base do Vite
├── package.json             # Dependências, metadados e scripts npm
├── tsconfig.json            # Configurações do compilador TypeScript
├── vite.config.ts           # Configurações de build e plugins do Vite
└── README.md                # Documentação oficial do projeto
```

## 🗺️ Roadmap de Evolução

* [x] Arquitetura frontend responsiva com React, TypeScript e Tailwind CSS
* [x] Integração com Groq API (`llama-3.3-70b-versatile`) para tutoria e quizzes
* [x] Autenticação e banco de dados PostgreSQL via Supabase
* [x] Deploy contínuo em produção na Vercel
* [ ] Containerização multi-stage com Docker Compose para banco local opcional
* [ ] Suite de testes automatizados (Vitest e Playwright)
* [ ] Dashboard analítico com gráficos de retenção e ofensivas (*streaks*)

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Se você quiser sugerir melhorias ou corrigir algum bug:

1. Abra uma [Issue](https://github.com/LucasLibonatti/OmniLearn/issues) descrevendo a sua sugestão ou problema encontrado.
2. Faça um *fork* deste repositório.
3. Crie uma branch para sua feature: `git checkout -b feat/minha-melhoria`.
4. Faça o commit das alterações: `git commit -m 'feat: adiciona nova funcionalidade'`.
5. Envie para o seu repositório: `git push origin feat/minha-melhoria`.
6. Abra um **Pull Request** detalhando as mudanças realizadas.

## 👨‍💻 Autor

Desenvolvido por **Lucas Alexander Libonatti**.

* 🐙 **GitHub:** [@LucasLibonatti](https://github.com/LucasLibonatti)
* 🌐 **Projeto Online:** [OmniLearn na Vercel](https://educacao-eficiente.vercel.app/)
* 💼 **LinkedIn:** [Lucas Alexander Libonatti](https://www.linkedin.com/)
