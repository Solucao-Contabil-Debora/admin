import * as React from "react";
import { useMemo, useState, useCallback, useRef } from "react";
import { ArrowUp, ArrowDown, GripVertical, Lock } from "lucide-react";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { ListingSkeleton } from "@shared/components/skeletons/ListingSkeleton";
import { EmptyState } from "@shared/components/ui/empty-state";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Card, CardContent } from "@shared/components/ui/card";
import { TableResizeHandle } from "@shared/components/ui/table-resize-handle";
import { useColumnResize } from "@shared/hooks/useColumnResize";
import { useColumnDragReorder } from "@shared/hooks/useColumnDragReorder";
import { useIsMobile } from "@shared/hooks/useMediaQuery";
import { cn } from "@shared/lib/utils";
import type { TableProps } from "@shared/components/types/crud";
import { RowContextMenu } from "./RowContextMenu";

export function Table<T extends { id: string }>({
  data,
  columns,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  renderActions,
  rowContextActions,
  isLoading = false,
  emptyMessage = "Nenhum item encontrado",
  emptyState,
  className,
  variant = "default",
  enableSelection = false,
  selectedIds = [],
  onSelectItem,
  onSelectAll,
  isAllSelected = false,
  isRowSelectable,
  enableColumnResize = true,
  onColumnResize,
  enableColumnReorder = false,
  onReorderColumns,
  storageKey,
  rowActionsVariant = "default",
  hideActionsColumn = false,
  actionsHeaderContent,
  disableMobileCards = false,
  mobileCardImage,
  enableRowDrag = false,
  onRowReorder,
  lockedRowIds,
  getRowTestId,
}: TableProps<T>): JSX.Element {
  const isMobile = useIsMobile();

  const [rowDragFromIndex, setRowDragFromIndex] = useState<number | null>(null);
  const [rowDragOverIndex, setRowDragOverIndex] = useState<number | null>(null);
  const dragFromHandle = useRef(false);

  const isLockedRow = useCallback(
    (item: T): boolean => lockedRowIds?.includes(item.id) ?? false,
    [lockedRowIds],
  );

  const handleRowDragStart = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>, index: number): void => {
      if (!dragFromHandle.current) {
        e.preventDefault();
        return;
      }
      dragFromHandle.current = false;
      e.dataTransfer.effectAllowed = "move";
      setRowDragFromIndex(index);
    },
    [],
  );

  const handleRowDragOver = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>, index: number, item: T): void => {
      e.preventDefault();
      if (isLockedRow(item) || index === rowDragFromIndex) return;
      setRowDragOverIndex(index);
    },
    [isLockedRow, rowDragFromIndex],
  );

  const handleRowDrop = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>): void => {
      e.preventDefault();
      if (
        rowDragFromIndex !== null &&
        rowDragOverIndex !== null &&
        rowDragFromIndex !== rowDragOverIndex
      ) {
        const next = [...data];
        const [moved] = next.splice(rowDragFromIndex, 1);
        next.splice(rowDragOverIndex, 0, moved);
        void onRowReorder?.(next);
      }
      setRowDragFromIndex(null);
      setRowDragOverIndex(null);
    },
    [rowDragFromIndex, rowDragOverIndex, data, onRowReorder],
  );

  const handleRowDragEnd = useCallback((): void => {
    setRowDragFromIndex(null);
    setRowDragOverIndex(null);
  }, []);

  const {
    columnWidths: resizedColumnWidths,
    isDragging: isColumnDragging,
    activeColumn,
    handleMouseDown: handleColumnResizeStart,
  } = useColumnResize({
    columns: columns.map((c) => ({
      key: String(c.key),
      minWidth: c.minWidth ?? 60,
      maxWidth: c.maxWidth ?? 500,
      defaultWidth: c.width ?? c.minWidth ?? 150,
    })),
    storageKey: storageKey ? `${storageKey}-columns` : undefined,
    onResize: onColumnResize,
    enabled: enableColumnResize,
  });

  const columnDrag = useColumnDragReorder({
    enabled: enableColumnReorder && !!onReorderColumns,
    onReorder: onReorderColumns ?? (() => undefined),
  });

  const columnWidthStyles = useMemo(() => {
    if (enableColumnResize) {
      const rawWidths = columns.map(
        (col) =>
          resizedColumnWidths[String(col.key)] ?? col.width ?? col.minWidth ?? 150,
      );
      const totalRaw = rawWidths.reduce((sum, w) => sum + w, 0);
      return rawWidths.map((w) => `${(w / totalRaw) * 100}%`);
    }

    const totalWeight = columns.reduce((sum, col) => {
      if (col.width) return sum;
      return sum + (col.weight ?? 1);
    }, 0);

    return columns.map((col) => {
      if (col.width) return `${col.width}px`;
      if (col.minWidth && !col.weight) return `${col.minWidth}px`;
      const weight = col.weight ?? 1;
      const percentage = (weight / totalWeight) * 100;
      return col.minWidth
        ? `minmax(${col.minWidth}px, ${percentage}%)`
        : `${percentage}%`;
    });
  }, [columns, enableColumnResize, resizedColumnWidths]);

  const getSortIcon = (columnKey: string): React.ReactNode => {
    if (sortField !== columnKey) return null;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };

  const isCard = variant === "card";
  const headDensity = isCard
    ? "py-1 align-middle [background-image:linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))]"
    : undefined;
  const cellDensity = isCard ? "h-[52px] py-2.5 align-middle" : undefined;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <ListingSkeleton
          headClassName={headDensity}
          cellClassName={cellDensity}
          rows={8}
          columns={columns.length}
          showActions={Boolean(renderActions) && !hideActionsColumn}
          enableSelection={enableSelection}
          variant={disableMobileCards ? "table" : "auto"}
        />
      </div>
    );
  }


  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {emptyState ?? <EmptyState title={emptyMessage} />}
      </div>
    );
  }


  const showActions = renderActions && !hideActionsColumn;

  if (isMobile && !disableMobileCards) {
    const [titleColumn, ...restColumns] = columns;
    return (
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {data.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const isSelectable = isRowSelectable ? isRowSelectable(item) : true;
          const image = mobileCardImage?.(item);
          return (
            <RowContextMenu key={item.id} actions={rowContextActions?.(item)}>
            <Card
              reveal={false}
              data-testid={getRowTestId?.(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "overflow-hidden",
                onRowClick && "cursor-pointer hover:bg-muted/50",
                enableSelection && isSelected && "bg-muted",
              )}
            >
              {image && (
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover bg-muted"
                />
              )}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {enableSelection && (
                    <div
                      className={cn("pt-0.5", !isSelectable && "opacity-40")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={!isSelectable}
                        onCheckedChange={() => onSelectItem?.(item.id)}
                        aria-label={`Selecionar ${item.id}`}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {titleColumn.render
                            ? titleColumn.render(item)
                            : String(item[titleColumn.key] ?? "-")}
                        </div>
                      </div>
                      {showActions && (
                        <div
                          className="shrink-0 -mt-1 -mr-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderActions(item)}
                        </div>
                      )}
                    </div>
                    {restColumns.map((column) => (
                      <div
                        key={String(column.key)}
                        className="flex justify-between items-start gap-2 mb-2 last:mb-0"
                      >
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          {column.header}:
                        </span>
                        <div className="text-sm text-foreground text-right min-w-0 break-words">
                          {column.render
                            ? column.render(item)
                            : String(item[column.key] ?? "-")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            </RowContextMenu>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-auto", isColumnDragging && "select-none")}>
      <ShadcnTable
        className={cn("table-fixed w-full", isCard && "[&_tbody_tr:last-child]:border-b", className)}
      >
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {enableRowDrag && <TableHead className={cn("w-[40px]", headDensity)} />}
            {enableSelection && (
              <TableHead className={cn("w-[40px]", headDensity)}>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
            )}
            {columns.map((column, index) => {
              const isResizable = enableColumnResize && column.resizable !== false;
              const isActive = activeColumn === String(column.key);
              const canDrag = enableColumnReorder && !!onReorderColumns;
              const dragProps = canDrag ? columnDrag.getDragProps(index) : {};
              const isDragSource = columnDrag.dragFromIndex === index;
              const isDragTarget =
                columnDrag.dragOverIndex === index &&
                columnDrag.dragFromIndex !== index;

              return (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    column.className,
                    headDensity,
                    "relative transition-opacity",
                    column.sortable && "cursor-pointer",
                    canDrag && columnDrag.isDragging && "cursor-grabbing",
                    isDragSource && "opacity-50",
                    isDragTarget && "border-l-2 border-primary",
                  )}
                  style={{ width: columnWidthStyles[index] }}
                  {...dragProps}
                >
                  {column.sortable !== false && onSort ? (
                    <button
                      onClick={() => onSort(String(column.key))}
                      className="flex items-center hover:text-foreground transition-colors font-medium"
                    >
                      {column.header}
                      {getSortIcon(String(column.key))}
                    </button>
                  ) : (
                    <span className="font-medium">{column.header}</span>
                  )}

                  {isResizable && (
                    <TableResizeHandle
                      direction="horizontal"
                      onMouseDown={(e) =>
                        handleColumnResizeStart(String(column.key), e)
                      }
                      isDragging={isActive}
                      className={index === columns.length - 1 && !showActions ? "mr-0" : undefined}
                    />
                  )}
                </TableHead>
              );
            })}
            {showActions && (
              <TableHead className={cn("w-[80px] text-right", headDensity)}>
                {actionsHeaderContent ?? "Ações"}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <RowContextMenu key={item.id} actions={rowContextActions?.(item)}>
            <TableRow
              data-testid={getRowTestId?.(item)}
              draggable={enableRowDrag && !isLockedRow(item)}
              onDragStart={(e) => enableRowDrag && handleRowDragStart(e, index)}
              onDragOver={(e) => enableRowDrag && handleRowDragOver(e, index, item)}
              onDrop={(e) => enableRowDrag && handleRowDrop(e)}
              onDragEnd={() => enableRowDrag && handleRowDragEnd()}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "relative",
                onRowClick && "cursor-pointer",
                rowActionsVariant === "inline" && "group",
                enableRowDrag && rowDragFromIndex === index && "opacity-40",
                enableRowDrag &&
                  rowDragOverIndex === index &&
                  rowDragFromIndex !== index &&
                  "border-t-2 border-primary",
              )}
            >
              {enableRowDrag && (
                <TableCell className={cn("w-[40px] pr-0", cellDensity)}>
                  {isLockedRow(item) ? (
                    <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <GripVertical
                      onMouseDown={() => { dragFromHandle.current = true; }}
                      onMouseUp={() => { dragFromHandle.current = false; }}
                      className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground cursor-grab mx-auto"
                    />
                  )}
                </TableCell>
              )}
              {enableSelection && (
                <TableCell className={cn(cellDensity, isRowSelectable && !isRowSelectable(item) && "opacity-40")}>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    disabled={isRowSelectable ? !isRowSelectable(item) : false}
                    onCheckedChange={() => onSelectItem?.(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar ${item.id}`}
                  />
                </TableCell>
              )}
              {columns.map((column, index) => (
                <TableCell
                  key={String(column.key)}
                  className={cn(column.className, cellDensity)}
                  style={{ width: columnWidthStyles[index] }}
                >
                  {column.render ? column.render(item) : String(item[column.key] ?? "-")}
                </TableCell>
              ))}
              {showActions && (
                <TableCell
                  className={cn("text-right", cellDensity)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={cn(
                      rowActionsVariant === "inline" &&
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                    )}
                  >
                    {renderActions(item)}
                  </div>
                </TableCell>
              )}
            </TableRow>
            </RowContextMenu>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}

export { Table as CrudPrimitiveTable };
export type { TableColumn } from "@shared/components/types/crud";
