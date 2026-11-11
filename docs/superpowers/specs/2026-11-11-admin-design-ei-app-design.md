# Padronização do design do admin com os componentes do ei-app

Data: 2026-11-11
Referência: `C:\Users\GuilhermedeFreitasRy\DevOps\new-system\ei-app` (commit mais recente, card 134250)
Alvo: `solucao-contabil/admin`

## Objetivo

O admin passa a ter a mesma identidade visual e o mesmo conjunto de componentes (shadcn/ui) do ei-app.
Primeira rodada: base visual + página piloto (`ClientsPage`). As demais páginas migram em rodadas seguintes.

## Fora de escopo

- Migrar `AnnouncementsPage`, `CalendarPage`, `DocumentsPage`, `RequestsPage` e `UsersPage` (apenas herdam o tema nesta rodada).
- Dark mode / alternância de tema (os tokens `.dark` do ei-app podem ser copiados depois).
- Pacote compartilhado entre repos.
- Mudança de lógica de negócio, rotas ou acesso a dados (Supabase).

## Decisões

- **Abordagem:** copiar os componentes shadcn do ei-app para o admin e adaptá-los ao Tailwind 4. O admin permanece em React 19 e Tailwind 4.
- **Tema:** claro, com os tokens do ei-app (primário `221 83% 53%`, base `slate`, `--radius: 0.5rem`). Sem alternância claro/escuro nesta rodada.
- **Dependências novas** (necessárias, justificadas pelos componentes): `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `tw-animate-css`. Versões alinhadas às do ei-app, exceto onde incompatíveis com React 19.

## Design

### 1. Base

- Instalar as dependências acima.
- Criar `src/lib/utils.ts` com `cn()` (`clsx` + `tailwind-merge`).
- Reescrever `src/index.css`:
  - Remover a escala `gray` invertida e o primário zinc do `@theme`.
  - Declarar os tokens do ei-app em `:root` (HSL sem `hsl()`, como no ei-app).
  - Mapear com `@theme inline` (`--color-primary: hsl(var(--primary))`, etc.) para as utilities do Tailwind 4 funcionarem (`bg-primary`, `text-muted-foreground`, `border-input`, ...).
  - Importar `tw-animate-css`.
  - Remover o bloco `-webkit-autofill` com cor fixa, que assume fundo escuro.

### 2. Componentes copiados (`src/components/ui/`)

Origem: `ei-app/src/shared/components/ui/`.
`button`, `input`, `label`, `select`, `table`, `badge`, `status-badge`, `dialog`, `dropdown-menu`, `sonner`, `skeleton`, `empty-state`, `sidebar` (se a `Sidebar` do ei-app for viável sem `react-router-dom`; caso contrário, mantém-se a estrutura atual da `Sidebar` com os novos tokens e componentes).

Adaptações permitidas: imports (`@shared/...` → caminhos relativos do admin), sintaxe de Tailwind 3→4 (ex.: `outline-none` → `outline-hidden`, `shadow` → `shadow-sm` conforme renomeações), remoção de dependências internas do ei-app que não existam no admin. Nenhuma mudança de API dos componentes.

### 3. Substituições

- `Dialog.tsx` e `ActionMenu.tsx`: viram wrappers finos sobre `ui/dialog` e `ui/dropdown-menu`, mantendo as props atuais para que as páginas não migradas continuem funcionando.
- `LoginForm.tsx`: reescrito com `Button`, `Input`, `Label`.
- `Sidebar.tsx`: reescrita com os tokens `--sidebar-*` do ei-app e ícones `lucide-react`.
- Ícones SVG inline do piloto viram `lucide-react`.

### 4. Piloto: `ClientsPage`

Migrar `<button>`, `<input>`, `<select>` e `<table>` (e as constantes de classe como `inputClassName`) para `Button`, `Input`, `Select` e `Table`. A lógica (`syncStatusOf`, queries, handlers) não muda. Cores de status (`text-red-400`, `text-yellow-400`, `text-gray-*`) passam para tokens/cores compatíveis com fundo claro (`text-destructive`, `text-muted-foreground`, etc.).

### 5. Páginas não migradas

Herdam o tema. Classes dependentes da escala `gray` invertida (`text-gray-*`, `bg-gray-*`, `border-gray-*`) passarão a usar a escala padrão do Tailwind, o que pode quebrar o contraste. Nesta rodada: inventariar o uso e corrigir apenas regressões gritantes de legibilidade; o restante fica para a migração de cada página.

## Verificação

- `npm run build` (tsc + vite) sem erros.
- `npm run lint` (oxlint) sem novos avisos.
- Abrir o admin no navegador e conferir: login, sidebar, `ClientsPage` (busca, listagem, diálogo, menu de ações) e uma página não migrada para checar a legibilidade.

## Riscos

- Conflito entre os tokens shadcn e a escala `gray` invertida atual (mitigado pela remoção da escala e pelo inventário do item 5).
- Componentes do ei-app com acoplamentos internos (ex.: `sidebar.tsx` com `react-router-dom` e hooks do ei-app); fallback descrito no item 2.
- Diferenças de versão (Tailwind 3→4, React 18→19) em classes e tipos dos componentes copiados.

## Decisões tomadas na execução (2026-11-11)

- A escala `gray` invertida e `primary-*` permanecem no `@theme` até a última página ser migrada; remover agora deixaria as 5 páginas não migradas escuras. Verificado visualmente: as 5 páginas seguem legíveis no tema novo.
- Componentes copiados: `button`, `input`, `label`, `select`, `table` (sem `useReveal`), `badge`, `dropdown-menu`, `dialog`, `alert-dialog`. Não copiados nesta rodada: `separator` (só era importado, sem uso), `sonner`, `skeleton`, `empty-state`, `status-badge`, `sidebar` (dependem de `ThemeContext`, `sheet`, `tooltip` e hooks do ei-app). A `Sidebar` foi refeita sem `ui/sidebar`.
- Tokens extras copiados do ei-app: `primary-hover`, `secondary-hover`, `destructive-light`, `success*`, `warning*`.
- `Dialog` usa `DialogContent` com dimensões customizadas (os tamanhos `sm/md/lg` do ei-app limitam a altura e cortariam conteúdo); a prop `stacked` foi removida (sem uso).
- Login usa `logo-black.png` e tema claro; bloco de autofill baseado em tokens.
- Na `ClientsPage`, o status de sincronização continua como texto com tokens; `Badge` só no "Acesso ao app". O botão "Vincular" fica desabilitado sem usuário selecionado.

## Pendências para a próxima rodada

- Migrar `UsersPage`, `CalendarPage`, `AnnouncementsPage`, `RequestsPage` e `DocumentsPage` e então remover a escala `gray` invertida e `primary-*`.
- Avaliar `sonner`, `skeleton`, `empty-state` e `ui/sidebar`.
- Telas autenticadas foram verificadas com Playwright e Supabase mockado; falta uma checagem com dados reais.

## Rodada 2: listagem, sidebar, header e filtro por badge (2026-11-11)

- Copiados do ei-app (arquivos praticamente idênticos): `CrudListPage`, `CrudActionBarV2` (filtros em chip), `CrudPageCard`, `CrudEmptyState`, `CrudRowActions`, `Table`/`Pagination`/`RowContextMenu`, `AppSidebar`, `AppHeader`, `AppLayout`, `HeaderUserMenu`, `ui/sidebar` e dependências (hooks `useCrud*`, `useColumn*`, `PageMetadataContext`).
- Alias `@shared` → `src` (tsconfig e vite): as pastas do admin espelham `shared` do ei-app, então os imports originais funcionam sem edição.
- Sem router: `NavLink.tsx` expõe `Link`/`useLocation` sobre o `NavigationContext` (`activePath`/`navigate`), e `AppSidebar`/`AppHeader` só trocaram o import de `react-router-dom`.
- `jsx-shim.d.ts` restaura o namespace global `JSX` removido no React 19.
- Removido o filtro de período (`date-range`) do `CrudActionBarV2`: exigiria `react-day-picker` e `date-fns` e nenhuma página o usa.
- Ajuste Tailwind 3→4 no `ui/sidebar`: `w-[--x]` → `w-(--x)`.
- `ClientsPage` migrada para `CrudListPage` (filtros "Acesso ao app" e "Sincronização", busca, ordenação, paginação); título e subtítulo vão para o header via `usePageMetadata`.
- Layout como no ei-app (`showHeader={false}`): sidebar na altura toda e `AppHeader` dentro da área de conteúdo, colado nela, com o menu do usuário nas `actions` do header. As outras 5 páginas rodam dentro do novo layout, ainda com título próprio duplicado ao do header.

## Rodada 3: demais páginas (2026-11-11)

- `UsersPage`, `RequestsPage`, `DocumentsPage` e `AnnouncementsPage` migradas para `CrudListPage` com filtros em chip; `CalendarPage` mantém a grade e usa `CrudActionBarV2` como barra de ações. Todas usam `usePageMetadata` (título/subtítulo no header), componentes `ui` e tokens.
- Abas viraram chips de filtro: Usuários (Papel), Solicitações (Situação, Tipo), Documentos (Tipo, obrigatório: Enviados/Recebidos), Comunicados (Agendamento, Tipo), Calendário (Cliente).
- Removidos do tema: escala `gray` invertida, escala `primary-*`, keyframes `dialog-*` e o `logo.png`; a tela "Acesso negado" também usa tokens.
- Pendências: `ui/textarea` e `ui/radio-group` (hoje `textarea` e radio nativos estilizados nas páginas); o chip de cliente do Calendário busca só pelo nome (antes buscava também por e-mail); título/subtítulo truncam no header em 390px.

- Calendário redesenhado: mesmo quadro (`CrudPageCard`) das listagens, cabeçalho do mês com navegação e legenda, grade que ocupa a altura com etiquetas (horário + título) e "+N notas", painel do dia lateral só quando há seleção (empilha no mobile, onde as células mostram pontos). `HeaderUserMenu` com `fitContent` evita truncar o título do header no mobile.
