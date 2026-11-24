---
name: release-and-portfolio-qa
description: >-
  Runs pre-release quality assurance and GitHub portfolio readiness checks for OmniLearn:
  TypeScript strict check, production build, bundle size budgets, dependency audit, dead
  placeholder/link scan, i18n integrity, LICENSE presence, and README synchronization.
  Use before committing, pushing, deploying to Vercel, or preparing the repository for
  recruiters and portfolio review.
---

# Release & Portfolio QA (OmniLearn)

Garante que o repositório do **OmniLearn** esteja sempre em padrão de produção e pronto para avaliação técnica por recrutadores no GitHub.

## 1. Verificação Automatizada

Execute o script de QA na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/release-and-portfolio-qa/scripts/qa-check.ps1
```

O script valida automaticamente:
1. **TypeScript & Build (`npm run build`):** zero erros de `tsc --noEmit` e geração limpa de `dist/`.
2. **Orçamento de Bundle (Performance):**
   - Chunk principal do app (`pages_app-*.js`) deve ficar abaixo de **150 kB** (raw) — bibliotecas pesadas (`pdfjs-dist`, `jszip`) precisam permanecer em chunks lazy-loaded.
   - Nenhuma imagem em `Icons/` ou `public/` deve exceder **150 kB** (preferir `.webp` otimizado).
3. **Higiene de Código & Links Mortos:**
   - Detecta links `href="#"`, comentários `TODO`/`TAREFA`, caminhos locais hardcoded (`C:\Users\...`) e chaves i18n cruas passadas em `tr('chave.com.ponto')`.
4. **Arquivos de Portfólio & Segurança:**
   - Verifica presença de `LICENSE` (MIT), `.env.example` limpo (sem segredos reais) e executa `npm audit --omit=dev`.

## 2. Checklist Manual de Sincronização (Antes de Push / Release)

Sempre que alterar arquitetura, stack ou variáveis de ambiente, confira:
- [ ] **`README.md` fiel à realidade:**
  - Não instrui variáveis de servidor no frontend (ex.: `GROQ_API_KEY` fica apenas no backend/Edge Functions, nunca `VITE_GROQ_API_KEY`).
  - Árvore de diretórios corresponde às pastas reais do repositório.
  - Todos os links externos (Demo Vercel, GitHub, LinkedIn) apontam para URLs reais e funcionais.
- [ ] **Testes do núcleo (`Vitest`, quando configurado):**
  - Cobrir `src/lib/answerMatch.ts` (Levenshtein, acentos, stopwords), `src/lib/dates.ts` (fuso `America/Sao_Paulo`, cálculo de streak) e `src/engine/adaptive.ts`.
- [ ] **Headers & CSP (`vercel.json`):**
  - Conferir que novas fontes, APIs ou domínios de storage/auth foram liberados no `Content-Security-Policy` sem usar `*` em `script-src`.
- [ ] **Registro de Memória (Obsidian):**
  - Em releases relevantes, registrar o resumo em `C04 Antigravity/03-Logs-Memoria/YYYY-MM-DD - Tema.md`.

## 3. Critério de Aprovação

Uma release só está pronta para `git push` quando:
- `qa-check.ps1` concluir sem falhas críticas (`[FAIL]`);
- `git diff --stat` não contiver arquivos temporários, `.env`, nem credenciais;
- Quaisquer avisos (`[WARN]`) estiverem explicitamente documentados ou justificados.
