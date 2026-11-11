import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageMetadata {
  title?: string;
  subtitle?: ReactNode;
  breadcrumbs?: PageBreadcrumbItem[];
  loading?: boolean;
}

interface PageMetadataContextValue {
  metadata: PageMetadata;
  setMetadata: (metadata: PageMetadata) => void;
  clearMetadata: () => void;
  headerActions?: ReactNode;
  setHeaderActions: (actions: ReactNode) => void;
  headerTabsElement: HTMLElement | null;
  setHeaderTabsElement: (element: HTMLElement | null) => void;
}

const PageMetadataContext = createContext<PageMetadataContextValue | undefined>(undefined);

interface PageMetadataProviderProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function PageMetadataProvider({ children, actions }: PageMetadataProviderProps) {
  const [metadata, setMetadata] = useState<PageMetadata>({});
  const [headerActions, setHeaderActions] = useState<ReactNode>(actions);
  const [headerTabsElement, setHeaderTabsElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderActions(actions);
  }, [actions]);

  const clearMetadata = useCallback(() => setMetadata({}), []);

  const value = useMemo<PageMetadataContextValue>(
    () => ({
      metadata,
      setMetadata,
      clearMetadata,
      headerActions,
      setHeaderActions,
      headerTabsElement,
      setHeaderTabsElement,
    }),
    [metadata, clearMetadata, headerActions, headerTabsElement]
  );

  return <PageMetadataContext.Provider value={value}>{children}</PageMetadataContext.Provider>;
}

export function usePageMetadataContext(): PageMetadataContextValue {
  const context = useContext(PageMetadataContext);
  if (!context) {
    throw new Error("usePageMetadataContext must be used within PageMetadataProvider");
  }
  return context;
}

export function usePageMetadata(metadata: PageMetadata): void {
  const { setMetadata, clearMetadata } = usePageMetadataContext();
  const prevRef = useRef<PageMetadata>({});

  useEffect(() => {
    const breadcrumbsChanged =
      JSON.stringify(prevRef.current.breadcrumbs) !== JSON.stringify(metadata.breadcrumbs);
    if (
      prevRef.current.title !== metadata.title ||
      prevRef.current.subtitle !== metadata.subtitle ||
      prevRef.current.loading !== metadata.loading ||
      breadcrumbsChanged
    ) {
      prevRef.current = {
        title: metadata.title,
        subtitle: metadata.subtitle,
        breadcrumbs: metadata.breadcrumbs,
        loading: metadata.loading,
      };
      setMetadata(metadata);
    }
    return () => clearMetadata();
  }, [metadata.title, metadata.subtitle, metadata.breadcrumbs, metadata.loading, setMetadata, clearMetadata]);
}
