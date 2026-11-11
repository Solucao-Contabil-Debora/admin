import type { LucideIcon } from "lucide-react";

export interface SidebarNavigationItem {
  label: string;
  path: string;
  /** Rotas adicionais que mantêm o item marcado como ativo (ex.: telas filhas fora do prefixo de `path`). */
  activePaths?: string[];
  icon?: LucideIcon;
  /** `section` renderiza o `label` como título de grupo (some quando a sidebar está recolhida). */
  type?: "separator" | "section";
  /** `back` renderiza o item como link discreto de retorno (ex.: "Meus eventos") em vez de item de menu.
   * `group` renderiza um grupo só de agrupamento (o `path` é só chave, não navega): abre/fecha ao clicar e,
   * com a sidebar recolhida, lista os `children` num dropdown. */
  variant?: "back" | "group";
  children?: SidebarNavigationItem[];
  /** Contador exibido como pílula ao lado do label (ex.: pendências); vira um ponto com a sidebar recolhida. */
  complementaryText?: string;
  /** Em `children` de um grupo: título de seção exibido quando muda em relação ao item anterior. */
  section?: string;
  dropdownHeader?: string;
  permissionCheck?: () => Promise<boolean>;
  /** Etiqueta curta exibida ao lado do label (ex.: "Premium") — usada por itens gateados por
   * plano/combo (ver `usePlanoMensalStatus`, `docs/frd/gestao/acomodacoes.md`). */
  badge?: string;
  /** Intercepta o clique antes da navegação — retornar `true` cancela a navegação (ex.: abrir um
   * dialog de upsell) e `false`/`undefined` deixa o `Link` navegar normalmente. */
  onIntercept?: () => boolean;
}

export interface SidebarAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
}

export interface SidebarActionsConfig {
  triggerLabel?: string;
  triggerIcon?: LucideIcon;
  variant?: "button" | "split-button";
  actions: SidebarAction[];
}

export interface SidebarConfig {
  appName?: string;
  navigation?: SidebarNavigationItem[];
  moduleActions?: SidebarActionsConfig;
}
