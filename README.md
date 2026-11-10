# 🎓 OmniLearn — Educação Eficiente com IA

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> **OmniLearn (Educação Eficiente)** é uma plataforma moderna de aprendizagem assistida por Inteligência Artificial que transforma documentos e conteúdos estáticos em experiências de estudo interativas e gamificadas.

🔗 **Demo em Produção:** [OmniLearn](https://educacao-eficiente.vercel.app/)

---

## 🎯 Sobre o Projeto (O Problema e a Solução)

O estudo tradicional baseado apenas na leitura passiva de documentos e PDFs costuma gerar baixa retenção de conteúdo e falta de engajamento. 

O **OmniLearn** foi desenvolvido para resolver esse gargalo unindo **processamento de linguagem natural de ultrabaixa latência (via Groq API)** com **mecânicas de gamificação**. A plataforma permite que estudantes interajam diretamente com seus materiais de estudo, gerem resumos dinâmicos, pratiquem com desafios gerados sob demanda pela IA e acompanhem seu progresso de forma estruturada.

---

## ✨ Funcionalidades Principais

* 📄 **Interação Inteligente com Conteúdos:** Análise de documentos e textos para tirar dúvidas contextualizadas, gerar explicações simplificadas e extrair conceitos-chave.
* 🎮 **Aprendizado Gamificado:** Geração automática de quizzes, flashcards e desafios interativos baseados no material estudado, mantendo o engajamento alto.
* ⚡ **Respostas em Tempo Real:** Integração com a **Groq API**, garantindo inferência de LLMs quase instantânea para não interromper o fluxo cognitivo do usuário.
* 🔐 **Autenticação e Persistência Segura:** Gestão de usuários, sessões e histórico de evolução integrados ao **Supabase (PostgreSQL)**, seguindo boas práticas de privacidade e proteção de dados (LGPD).
* 📱 **Interface Responsiva e Acessível:** UI construída com **Tailwind CSS**, focada em usabilidade, leitura confortável e navegação fluida em desktop e dispositivos móveis.

---

## 🛠️ Stack Tecnológica

### Frontend
* **React + Vite:** Arquitetura de componentes rápida, modular e otimizada para performance em produção.
* **TypeScript:** Tipagem estática ponta a ponta para maior segurança do código, previsibilidade e facilidade de manutenção.
* **Tailwind CSS:** Estilização utilitária para construção de um design system consistente e responsivo.

### Backend, Banco de Dados & IA
* **Supabase (BaaS):** Banco de dados relacional **PostgreSQL** gerenciado, autenticação de usuários (Auth) e controle de acesso baseado em políticas (Row Level Security - RLS).
* **Groq API:** Motor de inferência de IA para geração de trilhas, perguntas gamificadas e tutoria inteligente com baixa latência.

### DevOps & Infraestrutura
* **Docker & Docker Compose:** Containerização completa da aplicação e do banco PostgreSQL local, garantindo reprodutibilidade imediata em qualquer máquina.
* **Vercel:** Pipeline de CI/CD automatizado integrado ao GitHub para deploy contínuo do frontend.

---

## 🧠 Decisões de Arquitetura (Destaques Técnicos)

1. **Por que Groq API na camada de IA?**
   Em aplicações educacionais e gamificadas, a latência da IA impacta diretamente a retenção do usuário. A escolha da Groq permitiu entregar feedbacks e quizzes em frações de segundo, criando uma experiência fluida de tempo real.
2. **Abordagem Híbrida de Banco de Dados (Cloud + Local):**
   Enquanto o ambiente de produção utiliza o **Supabase** pela escalabilidade e segurança gerenciada, o repositório conta com **Docker Compose** provisionando um PostgreSQL local. Isso permite que qualquer desenvolvedor ou avaliador suba o ambiente completo sem depender de chaves externas de banco na nuvem.
3. **Privacidade by Design (Adequação LGPD):**
   Coleta mínima de dados pessoais, consentimento transparente e estruturação pensada na segurança dos dados dos estudantes.

---

## 🚀 Como Executar o Projeto Localmente

Você pode rodar o projeto de duas maneiras: utilizando **Docker Compose** (recomendado para subir banco + app rapidamente) ou via **Node.js** diretamente.

### Pré-requisitos
* [Git](https://git-scm.com/)
* [Docker e Docker Compose](https://www.docker.com/) *(Opção 1)* ou [Node.js 20+](https://nodejs.org/) *(Opção 2)*
* Uma chave de API da [Groq](https://console.groq.com/)

### Passo 1: Clonar o repositório
~~~bash
git clone https://github.com/SEU-USUARIO/omnilearn.git
cd omnilearn
~~~

### Passo 2: Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

~~~env
# Configurações da IA
VITE_GROQ_API_KEY=sua_chave_groq_aqui

# Configurações do Supabase (Produção / BaaS)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase

# Banco de Dados Local (usado pelo Docker Compose)
DATABASE_URL=postgresql://postgres:postgrespassword@db:5432/omnilearn_local
~~~

### Opção 1: Rodando tudo com Docker Compose (Recomendado)
Suba a aplicação e o banco PostgreSQL local com um único comando:

~~~bash
docker compose up --build
~~~
A aplicação estará disponível em `http://localhost:3000` e o PostgreSQL na porta `5432`.

### Opção 2: Rodando com Node.js (Ambiente Nativo)
~~~bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
~~~
Acesse `http://localhost:5173` (ou a porta indicada no seu terminal).

---

## 📂 Estrutura do Projeto

~~~text
omnilearn/
├── src/
│   ├── components/      # Componentes reutilizáveis de UI e gamificação
│   ├── pages/           # Telas principais da plataforma
│   ├── services/        # Clientes de integração (Supabase e Groq API)
│   ├── hooks/           # Custom hooks para estado e lógica de estudo
│   ├── types/           # Definições de tipos e interfaces TypeScript
│   └── main.tsx         # Ponto de entrada da aplicação
├── Dockerfile           # Configuração da imagem da aplicação
├── docker-compose.yml   # Orquestração App + PostgreSQL local
├── package.json         # Dependências e scripts
└── README.md            # Documentação do projeto
~~~

---

## 🗺️ Roadmap de Evolução

- [x] Prototipação e interface responsiva com React e Tailwind CSS
- [x] Integração com Groq API para tutoria e gamificação
- [x] Persistência e autenticação com Supabase
- [x] Containerização com Docker e Docker Compose
- [ ] Implementação de testes automatizados (Vitest / Playwright)
- [ ] Dashboard de métricas avançadas de retenção de estudo
