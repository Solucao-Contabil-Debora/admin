import { Fragment, useCallback, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation } from "./NavLink";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@shared/hooks/useMediaQuery";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader as SidebarHeaderPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@shared/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shared/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/components/ui/tooltip";
import type { SidebarConfig, SidebarNavigationItem } from "@shared/components/types/sidebar";
import { cn } from "@shared/lib/utils";
import { SidebarBrandLogo } from "@shared/components/layout/SidebarBrandLogo";

interface AppSidebarProps {
  config?: SidebarConfig;
  customContent?: ReactNode;
  footer?: ReactNode;
  logoHref?: string;
  /** Slot entre o logo e o menu (ex.: busca global); recebe se a sidebar está expandida. */
  renderSearch?: (context: { isExpanded: boolean }) => ReactNode;
  /** Marca só o item de rota mais específica como ativo — evita acender dois itens quando um `path` é prefixo de outro. */
  exclusiveActive?: boolean;
}

interface NavigationItemProps {
  item: SidebarNavigationItem;
  isExpanded: boolean;
  isActive: (item: SidebarNavigationItem) => boolean;
  onNavigate: () => void;
}

const ComplementaryPill = ({ value }: { value: string }): JSX.Element => (
  <span
    data-testid="sidebar-item-count"
    className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground tabular-nums"
  >
    {value}
  </span>
);

const ComplementaryDot = (): JSX.Element => (
  <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-primary" />
);

const startsNewSection = (items: SidebarNavigationItem[], index: number): boolean => {
  const section = items[index]?.section;
  return Boolean(section) && section !== items[index - 1]?.section;
};

function NavigationSubItemRenderer({ item, isActive, onNavigate }: Omit<NavigationItemProps, "isExpanded">) {
  const Icon = item.icon;

  const handleClick = (event: MouseEvent): void => {
    if (item.onIntercept?.()) {
      event.preventDefault();
      return;
    }
    onNavigate();
  };

  return (
    <SidebarMenuSubItem>
      <SidebarMenuButton asChild isActive={isActive(item)} size="default" className="h-8 px-2.5 py-0 text-[13px]">
        <Link to={item.path} className="flex w-full items-center gap-2.5" onClick={handleClick}>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {Icon && <Icon className="h-4 w-4" />}
          </span>
          <span className="font-medium sidebar-text flex-1 min-w-0 truncate">{item.label}</span>
          {item.badge && (
            <span
              data-testid="sidebar-item-badge"
              className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
            >
              {item.badge}
            </span>
          )}
          {item.complementaryText && <ComplementaryPill value={item.complementaryText} />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

function NavigationGroupRenderer({ item, isExpanded, isActive, onNavigate }: NavigationItemProps) {
  const Icon = item.icon;
  const children = item.children ?? [];
  const groupActive = children.some((child) => isActive(child));
  const [manualOpen, setManualOpen] = useState<boolean | undefined>(undefined);
  const isOpen = manualOpen ?? groupActive;

  if (!isExpanded) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={item.label}
              className={cn(
                "relative flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-colors",
                groupActive ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.complementaryText && <ComplementaryDot />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-[220px]">
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </DropdownMenuLabel>
            {children.map((child, index) => {
              const ChildIcon = child.icon;
              return (
                <Fragment key={child.path}>
                  {startsNewSection(children, index) && (
                    <>
                      {index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        {child.section}
                      </DropdownMenuLabel>
                    </>
                  )}
                  <DropdownMenuItem asChild className={cn(isActive(child) && "bg-primary/10 text-primary")}>
                    <Link to={child.path} className="flex items-center gap-2" onClick={onNavigate}>
                      {ChildIcon && <ChildIcon className="h-4 w-4" />}
                      <span className="flex-1">{child.label}</span>
                      {child.complementaryText && <ComplementaryPill value={child.complementaryText} />}
                    </Link>
                  </DropdownMenuItem>
                </Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setManualOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton size="default" className="h-8 w-full gap-2.5 px-2.5 py-0 text-[13px]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {Icon && <Icon className={cn("h-4 w-4", groupActive && "text-primary")} />}
            </span>
            <span className={cn("font-medium sidebar-text flex-1 min-w-0 truncate", groupActive && "text-primary")}>
              {item.label}
            </span>
            {item.complementaryText && !isOpen && <ComplementaryPill value={item.complementaryText} />}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child, index) => (
              <Fragment key={child.path}>
                {startsNewSection(children, index) && (
                  <li
                    role="presentation"
                    data-testid="sidebar-section-label"
                    className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {child.section}
                  </li>
                )}
                <NavigationSubItemRenderer item={child} isActive={isActive} onNavigate={onNavigate} />
              </Fragment>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavigationItemRenderer({ item, isExpanded, isActive, onNavigate }: NavigationItemProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children && item.children.length > 0;

  const handleLeafClick = (event: MouseEvent): void => {
    if (item.onIntercept?.()) {
      event.preventDefault();
      return;
    }
    onNavigate();
  };

  if (item.variant === "back") {
    return (
      <SidebarMenuItem className="pb-2">
        {isExpanded ? (
          <Link
            to={item.path}
            onClick={handleLeafClick}
            data-testid="sidebar-back-link"
            className="flex w-full items-center gap-1 rounded-md px-1 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                onClick={handleLeafClick}
                data-testid="sidebar-back-link"
                className="flex items-center justify-center h-8 w-8 mx-auto rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </SidebarMenuItem>
    );
  }

  if (item.variant === "group" && hasChildren) {
    return <NavigationGroupRenderer item={item} isExpanded={isExpanded} isActive={isActive} onNavigate={onNavigate} />;
  }

  if (hasChildren) {
    if (!isExpanded) {
      return (
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground">
                {Icon && <Icon className="h-4 w-4" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }
    return (
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive(item)} size="default" className="h-8 px-2.5 py-0 text-[13px]">
            <Link to={item.path} className="flex w-full items-center gap-2.5" onClick={onNavigate}>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {Icon && <Icon className="h-4 w-4" />}
              </span>
              <span className="font-medium sidebar-text">{item.label}</span>
              <CollapsibleTrigger asChild>
                <span
                  role="button"
                  aria-label="Expandir/recolher"
                  className="ml-auto flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
                  onClick={(e) => e.preventDefault()}
                >
                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </span>
              </CollapsibleTrigger>
            </Link>
          </SidebarMenuButton>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children!.map((subItem) => (
                <NavigationSubItemRenderer
                  key={subItem.path}
                  item={subItem}
                  isActive={isActive}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      {isExpanded ? (
        <SidebarMenuButton asChild isActive={isActive(item)} size="default" className="h-8 px-2.5 py-0 text-[13px]">
          <Link to={item.path} className="flex w-full items-center gap-2.5" onClick={handleLeafClick}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {Icon && <Icon className="h-4 w-4" />}
            </span>
            <span className="font-medium sidebar-text flex-1 min-w-0 truncate">{item.label}</span>
            {item.badge && (
              <span
                data-testid="sidebar-item-badge"
                className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
              >
                {item.badge}
              </span>
            )}
            {item.complementaryText && <ComplementaryPill value={item.complementaryText} />}
          </Link>
        </SidebarMenuButton>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              onClick={handleLeafClick}
              className={cn(
                "relative flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-colors",
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.complementaryText && <ComplementaryDot />}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}{item.badge ? ` · ${item.badge}` : ""}{item.complementaryText ? ` · ${item.complementaryText}` : ""}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  config,
  customContent,
  footer,
  logoHref,
  renderSearch,
  exclusiveActive = false,
}: AppSidebarProps = {}) {
  const { open, setOpenMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isExpanded = isMobile ? true : open;

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const matchesPath = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname]
  );

  const exclusiveMatchOwner = useMemo(() => {
    if (!exclusiveActive) return null;
    let bestPath = "";
    let bestOwner: string | null = null;
    const visit = (items: SidebarNavigationItem[] | undefined): void => {
      items?.forEach((item) => {
        if (item.children?.length) {
          visit(item.children);
          return;
        }
        if (item.type || item.variant === "back") return;
        [item.path, ...(item.activePaths ?? [])].forEach((path) => {
          if (matchesPath(path) && path.length > bestPath.length) {
            bestPath = path;
            bestOwner = item.path;
          }
        });
      });
    };
    visit(config?.navigation);
    return bestOwner;
  }, [exclusiveActive, config?.navigation, matchesPath]);

  const isActive = useCallback(
    (item: SidebarNavigationItem) => {
      if (exclusiveActive && !item.children?.length) return item.path === exclusiveMatchOwner;
      return [item.path, ...(item.activePaths ?? [])].some(matchesPath);
    },
    [exclusiveActive, exclusiveMatchOwner, matchesPath]
  );

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "app-sidebar bg-background group-data-[side=left]:border-r-0 after:pointer-events-none after:absolute after:-right-px after:bottom-0 after:top-[calc(var(--content-header-height,56px)+16px)] after:w-px after:bg-border after:content-[''] flex flex-col",
        isExpanded ? "px-2" : "px-1.5"
      )}
    >
      <SidebarHeaderPrimitive className="p-0 gap-0 h-14">
        <SidebarBrandLogo open={isExpanded} onToggle={isMobile ? undefined : toggleSidebar} href={logoHref} />
      </SidebarHeaderPrimitive>

      {renderSearch && (
        <div className={cn("pt-3", !isExpanded && "flex justify-center")}>{renderSearch({ isExpanded })}</div>
      )}

      <SidebarContent className="pt-2">
        {customContent ? (
          customContent
        ) : (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                <TooltipProvider>
                  {config?.navigation?.map((item, index) => {
                    if (item.type === "section") {
                      const isFirst = index === 0 || config.navigation?.[index - 1]?.variant === "back";
                      if (!isExpanded) {
                        return isFirst ? null : <SidebarSeparator key={item.path} className="my-2" />;
                      }
                      return (
                        <li
                          key={item.path}
                          role="presentation"
                          data-testid="sidebar-section-label"
                          className={cn(
                            "px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80",
                            isFirst ? "pt-0.5" : "pt-3"
                          )}
                        >
                          {item.label}
                        </li>
                      );
                    }
                    if (item.type === "separator") {
                      return <SidebarSeparator key={`sep-${index}`} className="my-2" />;
                    }
                    return (
                      <NavigationItemRenderer
                        key={item.path}
                        item={item}
                        isExpanded={isExpanded}
                        isActive={isActive}
                        onNavigate={closeSidebarOnMobile}
                      />
                    );
                  })}
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {footer && <SidebarFooter className="border-t border-sidebar-border p-2">{footer}</SidebarFooter>}
    </Sidebar>
  );
}

export default AppSidebar;
