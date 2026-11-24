# Referência LGPD — Mapa de Dados e Checklist do OmniLearn

## 1. Inventário de Dados Pessoais do OmniLearn

| Categoria | Dados Coletados | Onde Fica | Base Legal Sugerida |
| :--- | :--- | :--- | :--- |
| Identificação | Nome, e-mail, ID de usuário, foto de avatar | Auth + tabela `profiles` + bucket `avatars` | Execução de contrato (Art. 7º, V) |
| Consentimento | `terms_version`, `terms_accepted_at`, `privacy_accepted_at` | `profiles` / metadados de Auth | Obrigação legal / Consentimento (Art. 7º, I e II) |
| Estudo | Matérias, PDFs/PPTX, `extracted_text`, questões, respostas, progresso, XP, streak | Tabelas `subjects`, `materials`, `questions`, `answers`, `sessions`, `question_progress` + bucket `materials` | Execução de contrato (Art. 7º, V) |
| Suporte | Nome (opcional), e-mail (opcional), assunto, mensagem | Tabela `support_messages` | Execução de contrato / Legítimo interesse |
| Preferências locais | Idioma (`omni-lang`), tema (`omni-theme`), som (`omni-sound`), lembrete (`omni-reminder`) | `localStorage` do navegador (sem cookies de rastreamento/anúncios) | Estritamente necessário (dispensa banner invasivo de cookies de marketing) |

## 2. Lacunas Conhecidas para Fechar no OmniLearn

1. **Google OAuth sem registro de aceite (`src/AuthPage.tsx`):**
   - O botão "Continuar com Google" dispara `signInWithGoogle()` sem validar nem registrar aceite dos Termos/Privacidade.
   - **Solução:** armazenar `terms_version` e `terms_accepted_at` em `profiles` e exibir um modal obrigatório de aceite na primeira entrada caso `terms_accepted_at` seja nulo ou desatualizado.
2. **Exclusão incompleta no `delete-account` (`supabase/functions/delete-account/index.ts`):**
   - Apaga arquivos de `materials` e o usuário do Auth, mas **não apaga o arquivo no bucket `avatars`** nem anonimiza `support_messages` com o e-mail do usuário.
   - **Solução:** listar e remover `${user.id}/*` no bucket `avatars` e apagar/anonimizar `support_messages` correspondentes antes de chamar `deleteUser`.
3. **Ausência de Portabilidade / Exportação (Art. 18, II e V):**
   - Falta botão "Baixar meus dados (JSON)" em Perfil.
   - **Solução:** função client-side/endpoint que exporta `profile`, `subjects`, `sessions`, `answers`, `achievements` em um arquivo `omnilearn-meus-dados-YYYY-MM-DD.json`.
4. **Filtro preventivo de PII antes da Groq API:**
   - Adicionar utilitário leve (`src/lib/piiCheck.ts`) que detecta CPF (`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`), CNPJ, padrões de cartão de crédito (Luhn/16 dígitos) e avisa/bloqueia o envio antes de subir o texto para a IA.
5. **Canal de Encarregado / Contato LGPD (Art. 41):**
   - Em `pages_legal.tsx`, linkar diretamente para `/suporte` como canal oficial para solicitações de privacidade e direitos do titular.

## 3. Aviso Importante
Esta skill cobre **boas práticas técnicas de Privacy by Design** alinhadas à LGPD para projetos acadêmicos, open-source e MVPs. Não substitui parecer jurídico formal em operações comerciais de grande escala.
