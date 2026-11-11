# Padronização do design do admin (ei-app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O admin passa a usar os componentes shadcn e os tokens visuais do ei-app, com `ClientsPage` como página piloto.

**Architecture:** Copiar os componentes de `ei-app/src/shared/components/ui/` para `admin/src/components/ui/`, adaptando para Tailwind 4 / React 19. Tokens do ei-app em HSL no `:root`, expostos ao Tailwind 4 via `@theme inline`. `Dialog.tsx` e `ActionMenu.tsx` viram wrappers finos (mesmas props) sobre os componentes copiados.

**Tech Stack:** React 19, Tailwind 4, Vite, TypeScript, Radix UI, class-variance-authority, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-11-admin-design-ei-app-design.md`

## Global Constraints

- Referência: `C:\Users\GuilhermedeFreitasRy\DevOps\new-system\ei-app` (componentes em `src/shared/components/ui/`, tokens em `src/index.css`).
- Tema claro, primário `221 83% 53%`, `--radius: 0.5rem`, sem dark mode.
- Admin fica em React 19 e Tailwind 4 (sem downgrade). Sem alteração de lógica de negócio, rotas ou Supabase.
- Sem framework de testes no admin e sem adicioná-lo: a verificação é `npm run build`, `npm run lint` e conferência no navegador (`npm run dev`).
- Repositório `admin/` é git próprio, branch `main`: commitar direto na `main`, sem criar branch. Mensagens em português, terminando com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Seguir `admin/CLAUDE.md`: menor alteração possível, sem arquivos ou abstrações sem benefício claro.
- Spec e plano em `docs/` entram no primeiro commit (estão não rastreados).

## Decisões que refinam o spec

- **Escala `gray` invertida e `primary-*` ficam no `@theme` até a última página ser migrada.** Remover agora faria as 5 páginas não migradas (cerca de 280 usos de `gray-*`) renderizarem escuras. Os tokens shadcn (`--color-background`, `--color-primary`...) não colidem com `gray-*`.
- **Copiar só o que o piloto usa:** `button`, `input`, `label`, `select`, `table`, `badge`, `dropdown-menu`, `dialog` (+ `alert-dialog` e `separator`, que o `dialog` importa). Ficam para a próxima rodada: `sonner` (depende de `ThemeContext`), `skeleton`, `empty-state`, `status-badge` e `sidebar` (puxa `sheet`, `tooltip`, `safeStorage`, `useIsMobile`). A `Sidebar` do admin é refeita sem `ui/sidebar` (fallback previsto no spec).
- **`table.tsx`:** remover `useReveal`/`REVEAL_ROW_CLASSES` e a prop `reveal` na cópia (hook do ei-app, não faz parte do escopo).

## Review Focus

- `Select` do Radix não aceita `SelectItem` com `value=""`; a opção "Selecione um usuário" da `ClientsPage` precisa virar placeholder.
- `Dialog` empilhado (`stacked`): o segundo diálogo deve ficar sobre o primeiro e Esc/clique fora fechar só o de cima.
- Menu de ações dentro de tabela com overflow: não pode ser cortado e deve fechar ao clicar fora.
- Sidebar mobile: abrir/fechar (`mobileOpen`/`onCloseMobile`) continua funcionando abaixo de `lg`.
- Autofill do navegador no login: texto legível em campo claro.
- Texto de erro de sync com várias linhas (`detail`) continua acessível (hoje vem em `title`).

---

### Task 1: Base — dependências, `cn()` e tokens

**Files:**
- Modify: `package.json` (via npm)
- Create: `src/lib/utils.ts`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` em `src/lib/utils.ts`; utilities Tailwind `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `text-destructive`, `border-border`, `border-input`, `ring-ring`, `bg-card`, `bg-popover`, `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border` e `rounded-lg/md/sm` derivados de `--radius`.

- [ ] **Step 1: Instalar dependências** — `npm i @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-dropdown-menu @radix-ui/react-separator class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`. Versões compatíveis com React 19 (usar as mais recentes se as do ei-app reclamarem de peer dependency).
- [ ] **Step 2: Criar `cn()`** em `src/lib/utils.ts` com `twMerge(clsx(inputs))`.
- [ ] **Step 3: Tokens em `src/index.css`.** Manter `@import "tailwindcss"` e os blocos `@theme` atuais (`gray-*`, `primary-*`). Adicionar `@import "tw-animate-css"`; copiar o bloco `:root` de `ei-app/src/index.css` (valores HSL sem `hsl()`, incluindo `--sidebar-*`; sem `.dark`); adicionar um segundo `@theme inline` mapeando cada token para `--color-<nome>: hsl(var(--<nome>))` e `--radius-lg/md/sm` a partir de `--radius`. Não definir `--color-primary` com o mesmo nome da escala `primary-*` existente: a escala é `--color-primary-300..950` e o token shadcn é `--color-primary` (sem sufixo), então coexistem. Remover o bloco `input:-webkit-autofill` (o texto branco forçado fica ilegível em campo claro). Deixar a regra `body` atual intacta; o fundo das telas migradas vem de `bg-background` nos próprios componentes.
- [ ] **Step 4: Verificar** — `npm run build` termina sem erros; `npm run dev`, abrir o admin e conferir que login e as 6 páginas continuam visualmente iguais às de antes.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: base de tokens e dependências do design ei-app"` (inclui `docs/`).

### Task 2: Componentes primitivos

**Files:**
- Create: `src/components/ui/{button,input,label,select,table,badge,dropdown-menu}.tsx`

**Interfaces:**
- Consumes: `cn` de Task 1.
- Produces: exports idênticos aos do ei-app (`Button`/`buttonVariants`, `Input`, `Label`, `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`, `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`, `Badge`/`badgeVariants`, `DropdownMenu*`).

- [ ] **Step 1: Copiar** cada arquivo de `ei-app/src/shared/components/ui/` para `src/components/ui/`.
- [ ] **Step 2: Adaptar:** `@shared/lib/utils` → `../../lib/utils`; em `table.tsx` remover `useReveal`, `REVEAL_ROW_CLASSES` e a prop `reveal`; ajustar sintaxe Tailwind 3→4 que quebre (ex.: `outline-none` → `outline-hidden`, `shadow` → `shadow-sm`, `ring` sem largura → `ring-3`), sem mudar API.
- [ ] **Step 3: Verificar** — `npm run build` e `npm run lint` sem erros novos.
- [ ] **Step 4: Commit** — `git add src/components/ui && git commit -m "feat: componentes ui base do ei-app"`.

### Task 3: Dialog e ActionMenu sobre os componentes novos

**Files:**
- Create: `src/components/ui/{dialog,alert-dialog,separator}.tsx`
- Modify: `src/components/Dialog.tsx`, `src/components/ActionMenu.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2) e `DropdownMenu*` (Task 2).
- Produces: `Dialog({ open, onClose, title, description?, maxWidth?: 'sm'|'md'|'lg'|'xl', stacked?: boolean, children }): JSX.Element` e `ActionMenu({ items: { label: string; onClick: () => void; danger?: boolean }[], width?: string }): JSX.Element` — **mesmas props de hoje**, para as páginas não migradas não mudarem.

- [ ] **Step 1: Copiar** `dialog`, `alert-dialog` e `separator` do ei-app; adaptar imports como na Task 2.
- [ ] **Step 2: Reescrever `Dialog.tsx`** como wrapper sobre os exports de `ui/dialog` (ler o arquivo copiado para os nomes exatos). `onClose` dispara em Esc, clique fora e botão fechar; `maxWidth` mapeia para `max-w-sm/md/lg/xl`; `stacked` aplica `z-index` acima do diálogo base. Remover `CLOSE_DURATION`, `XIcon` e o controle manual de animação (o Radix cuida).
- [ ] **Step 3: Reescrever `ActionMenu.tsx`** sobre `DropdownMenu*`; item `danger` usa `text-destructive`; remover o cálculo manual de posição e os listeners de clique fora; `width` vira classe do `DropdownMenuContent`.
- [ ] **Step 4: Verificar** — `npm run build` sem erros. No navegador, em `UsersPage` e `ClientsPage`: abrir/fechar diálogo por Esc, clique fora e botão; abrir o diálogo empilhado (ClientsPage → acesso) e confirmar que Esc fecha só o de cima; abrir o menu de ações numa linha da tabela, confirmar que não é cortado e fecha ao clicar fora.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: Dialog e ActionMenu sobre componentes ei-app"`.

### Task 4: Login e Sidebar

**Files:**
- Modify: `src/components/LoginForm.tsx`, `src/components/Sidebar.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label` (Task 2) e `cn`.
- Produces: `LoginForm({ onSubmit })` e `Sidebar({ activeView, onNavigate, userEmail, onSignOut, mobileOpen, onCloseMobile })` com **as mesmas props**; `NavKey` inalterado.

- [ ] **Step 1: `LoginForm.tsx`** — trocar `<input>`/`<button>`/`<label>` por `Input`/`Button`/`Label`; ícones inline por `lucide-react` (`Eye`, `EyeOff`, etc., conforme os existentes); cores `gray-*`/`zinc-*` por tokens (`bg-card`, `text-muted-foreground`, `border-input`, `text-destructive`).
- [ ] **Step 2: `App.tsx`** — casca de login e tela "Carregando..." com `bg-background`/`text-muted-foreground`; `MenuIcon` inline → `Menu` do `lucide-react`.
- [ ] **Step 3: `Sidebar.tsx`** — manter a estrutura e o comportamento mobile atuais; trocar cores por `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border`; item ativo com `bg-sidebar-accent text-sidebar-accent-foreground`; ícones SVG inline → `lucide-react` (`Users`, `Building2`, `CalendarDays`, `Megaphone`, `Inbox`, `FileText`, `LogOut`).
- [ ] **Step 4: Verificar** — `npm run build` e `npm run lint`. No navegador: login com autofill do navegador legível; trocar entre as 6 páginas; abaixo de `lg` abrir e fechar o menu lateral (`mobileOpen`/`onCloseMobile`).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: login e sidebar com tokens do ei-app"`.

### Task 5: Piloto — `ClientsPage`

**Files:**
- Modify: `src/pages/ClientsPage.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Select*`, `Table*`, `Badge`, `Label` (Task 2), `Dialog`/`ActionMenu` wrappers (Task 3).
- Produces: `ClientsPage` com o mesmo export e comportamento; `syncStatusOf(client): SyncStatus` continua com a mesma lógica (o campo `className` passa a conter classes de token/`Badge`).

- [ ] **Step 1: Trocar elementos** — 7 `<button>` → `Button` (variantes `default`, `outline`, `ghost`, `destructive` conforme o papel); 3 `<input>` → `Input` (busca mantém o ícone `Search` do `lucide-react` à esquerda); `<table>` → `Table*`; remover `inputClassName`, `SearchIcon` e `DownloadIcon` (→ `Search`, `Download`).
- [ ] **Step 2: `<select id="link-user">` → `Select`** controlado por `selectedUserId`. Radix não aceita `value=""`: usar `value={selectedUserId || undefined}` com `<SelectValue placeholder={users === null ? 'Carregando...' : 'Selecione um usuário'} />`. O `required` do form deve continuar impedindo envio sem seleção (validar em `handleLinkExisting` se o `required` nativo não valer para o Radix).
- [ ] **Step 3: Cores** — `text-gray-*`/`bg-gray-*`/`border-gray-*` → `text-muted-foreground`/`bg-card`/`border-border`; `text-red-400` → `text-destructive`; mensagem de sucesso → `text-green-600`. Status de sync em `Badge` (variantes `destructive`, `secondary`/`outline`); manter o `detail` em `title`.
- [ ] **Step 4: Verificar** — `npm run build` e `npm run lint`. No navegador: listar, buscar por nome/CNPJ, importar da Jettax (diálogo), vincular login existente selecionando um usuário no `Select`, tentar enviar sem seleção (deve bloquear), abrir o menu de ações, linha com erro de sync mostra o detalhe. Conferir vazio ("Nenhum cliente...") e erro com "Tentar novamente".
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: ClientsPage migrada para componentes ei-app"`.

### Task 6: Fechamento

**Files:**
- Modify: `docs/superpowers/specs/2026-11-11-admin-design-ei-app-design.md` (apenas as decisões que mudaram)

- [ ] **Step 1: Verificação final** — `npm run build` e `npm run lint` limpos; passar por login, sidebar e as 6 páginas no navegador anotando regressões de contraste nas 5 não migradas (não corrigir além de ilegibilidade; listar o resto).
- [ ] **Step 2: Atualizar o spec** com as 3 decisões da seção "Decisões que refinam o spec" e registrar as regressões encontradas como pendência da próxima rodada.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "docs: ajustes do spec após piloto"`.
