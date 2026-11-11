import type React from "react";
import type { CrudRowAction } from "../crud/components/CrudRowActions";

export interface BaseEntity {
  id: string;
  alias?: string;
  created_at?: string;
  updated_at?: string;
  is_removed?: boolean;
  is_actived?: boolean;
}

export interface TableColumn<T = unknown> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  weight?: number;
  width?: number;
  resizable?: boolean;
  hideable?: boolean;
  groupable?: boolean;
}

export interface TableMobileCardImage {
  src: string;
  alt: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  onRowClick?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  rowContextActions?: (item: T) => CrudRowAction[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  className?: string;
  variant?: "default" | "card";
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectItem?: (id: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isRowSelectable?: (item: T) => boolean;
  enableColumnResize?: boolean;
  columnWidths?: Record<string, number>;
  onColumnResize?: (widths: Record<string, number>) => void;
  enableColumnReorder?: boolean;
  onReorderColumns?: (fromIndex: number, toIndex: number) => void;
  storageKey?: string;
  rowActionsVariant?: "default" | "inline";
  hideActionsColumn?: boolean;
  actionsHeaderContent?: React.ReactNode;
  disableMobileCards?: boolean;
  mobileCardImage?: (item: T) => TableMobileCardImage | null | undefined;
  lockedRowIds?: string[];
  enableRowDrag?: boolean;
  onRowReorder?: (items: T[]) => void | Promise<void>;
  getRowTestId?: (item: T) => string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  variant?: "full" | "compact";
  pageSizeOptions?: number[];
  filterLabel?: string;
}

export interface BulkAction<T extends BaseEntity> {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  variant?: "primary" | "destructive" | "outline";
  action: (items: T[]) => void | Promise<void>;
  confirmMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface CustomAction {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  testId?: string;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  disabledReason?: string;
}

export type ViewMode = "table" | "list" | "grid";
