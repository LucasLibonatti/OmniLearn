---
name: lgpd-compliance-auditor
description: >-
  Audits and implements Brazilian LGPD (Lei nº 13.709/2018) compliance for OmniLearn,
  covering consent tracking (email + Google OAuth), data subject rights (export and full
  deletion across database + storage + support messages), PII/sensitive data safeguards
  before third-party AI inference (Groq/Llama), international transfer disclosure, and
  security controls. Use whenever reviewing privacy, terms, authentication, file uploads,
  AI endpoints, account deletion, or preparing a release.
---

# LGPD Compliance Auditor (OmniLearn)

Audita e implementa conformidade prática com a **LGPD (Lei nº 13.709/2018)** no OmniLearn (plataforma web educacional com autenticação, upload de arquivos e inferência de IA por terceiros).

> Para a matriz completa de artigos da LGPD, padrões de detecção de PII e mapa de dados do OmniLearn, leia [references/lgpd-checklist.md](./references/lgpd-checklist.md).

## Fluxo de Auditoria e Execução

Execute estas 6 verificações em ordem sempre que auditar o projeto ou criar/alterar funcionalidades que toquem dados pessoais:

### 1. Consentimento Auditável (Art. 7º, I e Art. 8º)
- Confirme que **todos** os fluxos de cadastro/login (e-mail/senha **e** Google OAuth) exigem aceite explícito da versão vigente dos Termos de Uso e Política de Privacidade.
- O registro deve persistir no banco (`terms_version`, `terms_accepted_at`, `privacy_accepted_at`), e não apenas em `user_metadata` opcional.
- Se `terms_version` mudar no futuro, exibir *consent gate* antes de liberar o painel.

### 2. Minimização e Prevenção de Dados Sensíveis antes da IA (Art. 5º, II, Art. 6º, III e Art. 11)
- Antes de enviar texto extraído (PDF/PPTX ou texto colado) para provedores de IA externos (ex.: Groq API), verifique se existe:
  1. Aviso visível de proibição de dados sensíveis e de terceiros na tela de envio.
  2. Verificação heurística client-side/server-side para alertar ou bloquear padrões óbvios de PII (CPF, RG, cartão, telefone, e-mail em massa) antes da inferência.
- Nunca gravar chaves de API ou texto bruto desnecessário em logs de console/servidor.

### 3. Transferência Internacional & Subprocessadores (Art. 33)
- Garanta que `src/pages_legal.tsx` e `src/i18n.tsx` listem com clareza **todos** os subprocessadores ativos (infraestrutura de banco/auth, storage, hospedagem e provedor de IA), país de processamento e base legal.
- Sempre que migrar banco, autenticação ou provedor de IA (ex.: Supabase → Firebase/Neon/Clerk), **atualize imediatamente** os textos legais PT e EN e incremente `terms_version`.

### 4. Direitos do Titular — Acesso, Portabilidade e Eliminação (Art. 18)
- **Acesso & Portabilidade (Art. 18, II e V):** confirmar que o usuário consegue baixar seus dados em formato estruturado (`JSON`) pela página de Perfil (perfil, matérias, histórico de sessões/respostas e conquistas).
- **Eliminação Completa (Art. 18, VI):** inspecionar o endpoint de exclusão (`delete-account` ou equivalente) garantindo remoção efetiva de:
  1. Arquivos enviados no bucket `materials`.
  2. Foto de perfil no bucket `avatars` (`${userId}/avatar.*`).
  3. Registros vinculados no banco (cascata ou exclusão explícita) e anonimização/remoção em `support_messages`.
  4. Conta no provedor de autenticação.

### 5. Retenção e Higiene de Dados (Art. 15 e Art. 16)
- Confirmar que existe mecanismo ou política documentada para excluir materiais individuais (arquivo + `extracted_text`) sem obrigar o usuário a apagar a conta inteira.

### 6. Segurança Técnica & Transparência (Art. 46)
- Verificar isolamento por usuário (RLS no PostgreSQL / Security Rules no Firestore) em todas as tabelas e buckets.
- Conferir cabeçalhos de segurança em `vercel.json` (`CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`) e sanitização (`DOMPurify`) em qualquer conteúdo HTML vindo de IA.

## Formato de Saída da Auditoria

Ao concluir uma auditoria, entregue:
1. **Tabela de Status** (`Conforme` / `Parcial` / `Crítico`) por item (1 a 6) com caminho exato dos arquivos afetados.
2. **Achados Críticos** ordenados por risco jurídico/técnico, com correção objetiva proposta.
3. **Validação:** rode `npm run build` após aplicar correções e confirme que `pages_legal.tsx`, `AuthPage.tsx` e os fluxos de exclusão/upload compilam sem erros.
