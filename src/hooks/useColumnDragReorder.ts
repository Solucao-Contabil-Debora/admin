import { useCallback, useMemo, useState } from "react";
import type React from "react";

export interface UseColumnDragReorderOptions {
  enabled?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export interface ColumnDragProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export interface UseColumnDragReorderReturn {
  dragFromIndex: number | null;
  dragOverIndex: number | null;
  isDragging: boolean;
  getDragProps: (index: number, columnKey?: string) => ColumnDragProps;
}

export function useColumnDragReorder({
  enabled = false,
  onReorder,
}: UseColumnDragReorderOptions): UseColumnDragReorderReturn {
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const reset = useCallback((): void => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, []);

  const getDragProps = useCallback(
    (index: number, columnKey?: string): ColumnDragProps => ({
      draggable: enabled,
      onDragStart: (e: React.DragEvent): void => {
        if (!enabled) return;
        setDragFromIndex(index);
        e.dataTransfer.effectAllowed = "copyMove";
        e.dataTransfer.setData("text/plain", String(index));
        if (columnKey) {
          e.dataTransfer.setData("application/column-key", columnKey);
        }
      },
      onDragOver: (e: React.DragEvent): void => {
        if (!enabled || dragFromIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDragEnter: (e: React.DragEvent): void => {
        if (!enabled || dragFromIndex === null) return;
        e.preventDefault();
        setDragOverIndex(index);
      },
      onDrop: (e: React.DragEvent): void => {
        e.preventDefault();
        if (!enabled || dragFromIndex === null || dragFromIndex === index) {
          reset();
          return;
        }
        onReorder(dragFromIndex, index);
        reset();
      },
      onDragEnd: (): void => reset(),
    }),
    [enabled, dragFromIndex, onReorder, reset],
  );

  return useMemo(
    () => ({
      dragFromIndex,
      dragOverIndex,
      isDragging: dragFromIndex !== null,
      getDragProps,
    }),
    [dragFromIndex, dragOverIndex, getDragProps],
  );
}
