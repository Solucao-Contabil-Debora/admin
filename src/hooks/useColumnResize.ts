import { useCallback, useEffect, useRef, useState } from "react";

interface ColumnConfig {
  key: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

interface UseColumnResizeProps {
  columns: ColumnConfig[];
  storageKey?: string;
  onResize?: (widths: Record<string, number>) => void;
  enabled?: boolean;
}

interface UseColumnResizeReturn {
  columnWidths: Record<string, number>;
  isDragging: boolean;
  activeColumn: string | null;
  handleMouseDown: (columnKey: string, e: React.MouseEvent) => void;
  resetWidths: () => void;
}

const DEFAULT_MIN_WIDTH = 60;
const DEFAULT_MAX_WIDTH = 500;
const DEFAULT_WIDTH = 150;

const buildDefaults = (columns: ColumnConfig[]): Record<string, number> =>
  columns.reduce<Record<string, number>>((acc, col) => {
    acc[col.key] = col.defaultWidth ?? DEFAULT_WIDTH;
    return acc;
  }, {});

export function useColumnResize({
  columns,
  storageKey,
  onResize,
  enabled = true,
}: UseColumnResizeProps): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (!enabled || typeof window === "undefined") return buildDefaults(columns);
    if (storageKey) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored) as Record<string, number>;
        } catch {
          return buildDefaults(columns);
        }
      }
    }
    return buildDefaults(columns);
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent): void => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setActiveColumn(columnKey);
      startX.current = e.clientX;
      startWidth.current = columnWidths[columnKey] ?? DEFAULT_WIDTH;
    },
    [enabled, columnWidths],
  );

  useEffect(() => {
    if (!isDragging || !activeColumn) return;

    const column = columns.find((c) => c.key === activeColumn);
    const minWidth = column?.minWidth ?? DEFAULT_MIN_WIDTH;
    const maxWidth = column?.maxWidth ?? DEFAULT_MAX_WIDTH;

    const handleMouseMove = (e: MouseEvent): void => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
      setColumnWidths((prev) => {
        const updated = { ...prev, [activeColumn]: newWidth };
        onResize?.(updated);
        return updated;
      });
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
      setActiveColumn(null);
      if (storageKey) {
        setColumnWidths((current) => {
          window.localStorage.setItem(storageKey, JSON.stringify(current));
          return current;
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, activeColumn, columns, storageKey, onResize]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const resetWidths = useCallback((): void => {
    const defaults = buildDefaults(columns);
    setColumnWidths(defaults);
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
    onResize?.(defaults);
  }, [columns, storageKey, onResize]);

  return { columnWidths, isDragging, activeColumn, handleMouseDown, resetWidths };
}
