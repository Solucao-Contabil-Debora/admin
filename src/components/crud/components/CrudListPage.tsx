import * as React from "react";
import { useMemo } from "react";
import { Table } from "../primitives/Table";
import { Pagination } from "../primitives/Pagination";
import { useCrudPagination } from "@shared/hooks/useCrudPagination";
import type { UseCrudSearchReturn } from "@shared/hooks/useCrudSearch";
import type { UseCrudSortReturn } from "@shared/hooks/useCrudSort";
import type { PaginationProps, TableColumn, TableProps } from "@shared/components/types/crud";
import { CrudActionBarV2, type CrudFilterDef, type CrudMoreAction, type CrudViewSelector } from "./CrudActionBarV2";
import { CrudEmptyState, type CrudEntityLabel } from "./CrudEmptyState";
import { CrudPageCard } from "./CrudPageCard";
import { CrudRowActions, type CrudRowAction } from "./CrudRowActions";

export interface CrudListPageTestIds {
  newButton?: string;
  moreActions?: string;
  rowActions?: string;
  empty?: string;
  error?: string;
  search?: string;
  table?: string;
}

export interface CrudListPageProps<T extends { id: string }> {
  entity: CrudEntityLabel;
  rows: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  search?: UseCrudSearchReturn;
  searchPlaceholder?: string;
  filterDefs?: CrudFilterDef[];
  hasActiveFilters?: boolean;
  resetKey?: string;
  sort?: UseCrudSortReturn;
  onNew?: () => void;
  newLabel?: string;
  newIcon?: React.ComponentType<{ className?: string }>;
  moreActions?: CrudMoreAction[];
  columnsSlot?: React.ReactNode;
  rowActions?: (item: T) => CrudRowAction[];
  onRowClick?: (item: T) => void;
  readOnly?: boolean;
  emptyIcon?: React.ReactNode;
  emptyDescription?: string;
  pageSize?: number;
  hidePagination?: boolean;
  hideActionBar?: boolean;
  serverPagination?: PaginationProps;
  viewSelector?: CrudViewSelector;
  filterLabel?: string;
  testIds?: CrudListPageTestIds;
  storageKey?: string;
  loadingLabel?: string;
  contentClassName?: string;
  summary?: React.ReactNode;
  belowBar?: React.ReactNode;
  tableProps?: Partial<Omit<TableProps<T>, "data" | "columns">>;
}

export function CrudListPage<T extends { id: string }>({
  entity,
  rows,
  columns,
  isLoading = false,
  isFetching = false,
  isError = false,
  onRetry,
  search,
  searchPlaceholder,
  filterDefs,
  hasActiveFilters = false,
  resetKey = "",
  sort,
  onNew,
  newLabel,
  newIcon,
  moreActions,
  columnsSlot,
  rowActions,
  onRowClick,
  readOnly = false,
  emptyIcon,
  emptyDescription,
  pageSize = 50,
  hidePagination = false,
  hideActionBar = false,
  serverPagination,
  viewSelector,
  filterLabel,
  testIds,
  storageKey,
  loadingLabel,
  contentClassName,
  summary,
  belowBar,
  tableProps,
}: CrudListPageProps<T>): JSX.Element {
  const { paginate, paginationProps } = useCrudPagination({
    totalItems: rows.length,
    initialPageSize: pageSize,
    resetKey: [search?.term ?? "", resetKey, sort?.signature ?? ""].join("|"),
  });
  const pageRows = useMemo(
    () => (hidePagination || serverPagination ? rows : paginate(rows)),
    [hidePagination, serverPagination, paginate, rows],
  );

  const newDefaultLabel = `Nov${entity.feminine ? "a" : "o"} ${entity.singular}`;
  const renderActions = useMemo(
    () => (rowActions
      ? (item: T): JSX.Element => <CrudRowActions actions={rowActions(item)} triggerTestId={testIds?.rowActions} />
      : undefined),
    [rowActions, testIds?.rowActions],
  );

  const renderContent = (): JSX.Element => {
    if (isError) {
      return (
        <div data-testid={testIds?.error}>
          <CrudEmptyState entity={entity} isError onRetry={onRetry} />
        </div>
      );
    }
    if (!isLoading && rows.length === 0) {
      return (
        <div data-testid={testIds?.empty}>
          <CrudEmptyState
            entity={entity}
            icon={emptyIcon}
            searchTerm={search?.term}
            hasFilters={hasActiveFilters}
            description={emptyDescription}
            action={
              onNew && !readOnly && !search?.term && !hasActiveFilters
                ? { label: newLabel ?? newDefaultLabel, onClick: onNew }
                : undefined
            }
          />
        </div>
      );
    }
    return (
      <Table<T>
        variant="card"
        data={pageRows}
        columns={columns}
        isLoading={isLoading}
        sortField={sort?.sortField}
        sortDirection={sort?.sortDirection}
        onSort={sort?.onSort}
        onRowClick={readOnly ? undefined : onRowClick}
        renderActions={renderActions}
        rowContextActions={rowActions}
        storageKey={storageKey}
        {...tableProps}
      />
    );
  };

  return (
    <CrudPageCard
      loading={isFetching || Boolean(search?.isSearching)}
      loadingLabel={loadingLabel ?? `Carregando ${entity.plural}`}
      contentClassName={contentClassName}
      contentTestId={testIds?.table}
      belowBar={belowBar}
      actionBar={
        hideActionBar ? undefined : (
          <CrudActionBarV2
            className="border-b-0 bg-muted"
            viewSelector={viewSelector}
            onNew={readOnly ? undefined : onNew}
            newButtonLabel={newLabel ?? newDefaultLabel}
            newButtonIcon={newIcon}
            newButtonTestId={testIds?.newButton}
            moreActionsTestId={testIds?.moreActions}
            searchTestId={testIds?.search}
            searchValue={search?.value}
            onSearchChange={search?.onChange}
            searchPlaceholder={searchPlaceholder ?? `Buscar ${entity.plural}...`}
            filters={filterDefs}
            columnsSlot={columnsSlot}
            moreActions={moreActions}
          />
        )
      }
      footer={
        summary || !hidePagination ? (
          <>
            {summary}
            {!hidePagination && <Pagination {...(serverPagination ?? paginationProps)} filterLabel={filterLabel} />}
          </>
        ) : undefined
      }
    >
      {renderContent()}
    </CrudPageCard>
  );
}
