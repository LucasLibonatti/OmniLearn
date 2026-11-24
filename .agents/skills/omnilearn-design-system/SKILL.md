---
name: omnilearn-design-system
description: >-
  Enforces OmniLearn's clean, minimalist, gamified SaaS visual standards across components,
  pages, dark mode, iconography, accessibility, and user feedback. Use when designing new UI,
  refactoring pages_app.tsx, fixing dark theme contrast, polishing the landing page, or
  removing amateur visual patterns.
---

# OmniLearn Design System & UI Polish

Garante que toda interface do OmniLearn tenha aparência **limpa, minimalista, gamificada e profissional** — evitando o visual "protótipo/amador".

## Princípios Inegociáveis

### 1. Hierarquia Visual e Superfícies
- **Tipografia:** `Nunito` como fonte principal, títulos com `tracking-tight` (`letter-spacing: -0.02em`) e pesos coerentes (`font-extrabold` para títulos, `font-semibold` para subtítulos/labels, `font-medium` para corpo).
- **Cards:** use `.card-surface` em cards estáticos (formulários, textos legais, configurações). Aplique `.card-interactive` **apenas** em cards realmente clicáveis (ex.: `SubjectCard`). Nunca aplique inclinação 3D (`rotateX`/`rotateY`) em formulários ou painéis de leitura.
- **Botões:** mantenha o estilo tátil `.btn3d` apenas nos CTAs primários/secundários principais; ações discretas de barra/linha usam botões planos com `hover:bg-slate-100`.

### 2. Consistência de Ícones (Fim da Mistura Visual)
- **Navegação, ações e estados:** use exclusivamente ícones vetoriais **Lucide** (`lucide-react`) com `size` padronizado (`16`, `18`, `20`).
- **Status e severidade:** substitua emojis de bolinha (`🔴`, `🟠`, `🟡`, `🟢`) ou de rótulo (`🎓`, `🃏`, `😅`, `😎`, `📎`, `✍️`) por **badges semânticos** (pílulas sutis com cor + ícone Lucide).
- **Ícones 3D WebP (`src/icons.tsx`):** reserve estritamente para **gamificação e identidade** (mascote Prof. Omni, ofensiva/fogo, conquistas e troféu de conclusão). Sempre em `.webp` otimizado, com `width`, `height`, `loading="lazy"` e `decoding="async"` (exceto o herói acima da dobra, que usa `fetchPriority="high"`).

### 3. Tema Escuro Sem Gambiarra
- Tailwind v4 já está configurado com `@custom-variant dark (&:where(.dark, .dark *));` em `src/index.css`.
- Em todo componente novo ou refatorado, prefira classes nativas `dark:*` ou tokens CSS semânticos (`--surface`, `--border`, `--text`) em vez de adicionar novos overrides `.dark .bg-* !important`.
- Valide sempre contraste mínimo **WCAG AA (4.5:1)** em ambos os temas (atenção especial a badges `amber`, `emerald`, `indigo` e gráficos SVG como `Ring`).

### 4. Micro-interações e Feedback Não Bloqueante
- Toda ação assíncrona do usuário (*Salvar meta*, *Renomear*, *Arquivar*, *Copiar/Compartilhar*, *Excluir*) deve fornecer feedback visual imediato (estado de loading no botão + confirmação via Toast ou status inline claro).
- Respeite sempre `@media (prefers-reduced-motion: reduce)`.

### 5. Acessibilidade Obrigatória
- Todo botão somente-ícone precisa de `aria-label` traduzido (`t(...)` ou `tr(...)`).
- Modais (`confirmDialog`) e dropdowns (`Select`) devem suportar `Escape`, navegação por teclado e restauração de foco.
- Imagens decorativas usam `alt=""` + `aria-hidden`; imagens informativas têm `alt` descritivo.

## Verificação Pós-Alteração
1. Testar visualmente **Light Mode** e **Dark Mode** (desktop `1280px` e mobile `390px`).
2. Se o plugin **Chrome DevTools** estiver ativo, inspecionar contraste, console sem erros/bloqueios de CSP e layout shift (CLS).
3. Rodar `npm run build` para confirmar ausência de erros de TypeScript ou CSS.
