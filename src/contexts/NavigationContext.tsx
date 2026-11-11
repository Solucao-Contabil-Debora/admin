import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SidebarConfig, SidebarNavigationItem } from "@shared/components/types/sidebar";

interface NavigationContextValue {
  navigation?: SidebarNavigationItem[];
  appName?: string;
  activePath: string;
  navigate: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextValue>({ activePath: "", navigate: () => {} });

interface NavigationProviderProps {
  children: ReactNode;
  config?: SidebarConfig;
  activePath: string;
  onNavigate: (path: string) => void;
}

export function NavigationProvider({ children, config, activePath, onNavigate }: NavigationProviderProps) {
  const value = useMemo<NavigationContextValue>(
    () => ({ navigation: config?.navigation, appName: config?.appName, activePath, navigate: onNavigate }),
    [config?.navigation, config?.appName, activePath, onNavigate]
  );
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext);
}
