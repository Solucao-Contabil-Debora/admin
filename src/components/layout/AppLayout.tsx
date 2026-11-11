import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { SidebarProvider } from "@shared/components/ui/sidebar";
import { NavigationProvider } from "@shared/contexts/NavigationContext";
import { PageMetadataProvider } from "@shared/contexts/PageMetadataContext";
import type { SidebarConfig } from "@shared/components/types/sidebar";
import { cn } from "@shared/lib/utils";
import { AppSidebar } from "./AppSidebar";
import AppHeader from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarConfig?: SidebarConfig;
  showHeader?: boolean;
  mobileNav?: ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  sidebarFooter?: ReactNode;
}

export const AppLayout = memo(function AppLayout({
  children,
  sidebar,
  sidebarConfig,
  showHeader = true,
  mobileNav,
  activePath,
  onNavigate,
  sidebarFooter,
}: AppLayoutProps) {
  const sidebarComponent = useMemo(
    () => sidebar || <AppSidebar config={sidebarConfig} footer={sidebarFooter} />,
    [sidebar, sidebarConfig, sidebarFooter]
  );

  const sidebarStyle = useMemo(
    () =>
      ({
        "--sidebar-width": "250px",
        "--sidebar-width-icon": "58px",
      }) as React.CSSProperties,
    []
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const syncHeaderHeight = useCallback(() => {
    if (!containerRef.current) return;
    const height = headerRef.current?.offsetHeight ?? 0;
    containerRef.current.style.setProperty("--header-height", `${height}px`);
  }, []);

  useEffect(() => {
    syncHeaderHeight();
    if (!headerRef.current) return;
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [syncHeaderHeight, showHeader]);

  return (
    <NavigationProvider config={sidebarConfig} activePath={activePath} onNavigate={onNavigate}>
      <PageMetadataProvider>
        <SidebarProvider defaultOpen style={sidebarStyle}>
          <div ref={containerRef} className="flex flex-col h-screen w-full overflow-hidden">
            {showHeader && (
              <div ref={headerRef} className="flex-shrink-0 sticky top-0 z-40 bg-primary">
                <AppHeader />
              </div>
            )}
            <div
              className={cn(
                "sidebar-container flex flex-1 overflow-hidden",
                mobileNav && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0",
              )}
            >
              {sidebarComponent}
              <main className="relative z-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30">{children}</div>
              </main>
            </div>
            {mobileNav}
          </div>
        </SidebarProvider>
      </PageMetadataProvider>
    </NavigationProvider>
  );
});
