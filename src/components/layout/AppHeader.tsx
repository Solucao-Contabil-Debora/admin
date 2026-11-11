import { memo, type ReactNode } from "react";
import { Link, useLocation } from "./NavLink";
import { PanelLeft, ChevronRight } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Skeleton } from "@shared/components/ui/skeleton";
import { useSidebar } from "@shared/components/ui/sidebar";
import { useNavigation } from "@shared/contexts/NavigationContext";
import { usePageMetadataContext } from "@shared/contexts/PageMetadataContext";
import { useContentHeaderHeight } from "@shared/hooks/useContentHeaderHeight";
import { cn } from "@shared/lib/utils";
import { HEADER_FRAME_CLASSES } from "./headerFrame";

interface AppHeaderProps {
  actions?: ReactNode;
  hideSidebarToggle?: boolean;
  titleActions?: ReactNode;
  tabs?: ReactNode;
  leading?: ReactNode;
}

const AppHeader = memo(function AppHeader({ actions, hideSidebarToggle = false, titleActions, tabs, leading }: AppHeaderProps) {
  const location = useLocation();
  const { navigation } = useNavigation();
  const { metadata, headerActions } = usePageMetadataContext();
  const { toggleSidebar } = useSidebar();
  const headerRef = useContentHeaderHeight<HTMLElement>();

  const exactNav = navigation?.find((item) => item.path === location.pathname);
  const prefixNav = navigation?.find((item) => location.pathname.startsWith(`${item.path}/`));
  const routeTitle = exactNav?.label || prefixNav?.label || "";

  const displayTitle = metadata.title || routeTitle;
  const isLoading = !!metadata.loading;

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-30 bg-background flex-shrink-0 border-b border-border px-3 md:border-b-0 md:px-4",
        HEADER_FRAME_CLASSES,
      )}
    >
      <div className="flex h-14 items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {leading}
        {!hideSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 flex-shrink-0 hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Alternar barra lateral"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex flex-col min-w-0">
          {metadata.breadcrumbs && metadata.breadcrumbs.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              {metadata.breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 min-w-0">
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <h1
                className={`text-base font-semibold text-foreground truncate ${
                  titleActions
                    ? "max-w-[140px] sm:max-w-[260px] md:max-w-[400px] lg:max-w-[500px]"
                    : "max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
                }`}
                title={displayTitle}
              >
                {displayTitle}
              </h1>
            )}
            {!isLoading && titleActions && <div className="flex-shrink-0">{titleActions}</div>}
          </div>

          {!isLoading && metadata.subtitle && (
            <div className="text-xs text-muted-foreground truncate">{metadata.subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">{headerActions || actions}</div>
      </div>
      {tabs}
    </header>
  );
});

export default AppHeader;
export { AppHeader };
