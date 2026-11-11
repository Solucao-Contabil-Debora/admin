import { useCallback, useEffect, useMemo, useState } from "react";

export interface UseCrudPaginationOptions {
  totalItems: number;
  initialPageSize?: number;
  resetKey?: string;
}

export interface CrudPaginationBinding {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export interface UseCrudPaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginate: <T>(items: T[]) => T[];
  paginationProps: CrudPaginationBinding;
}

export function useCrudPagination({
  totalItems,
  initialPageSize = 50,
  resetKey = "",
}: UseCrudPaginationOptions): UseCrudPaginationReturn {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPageState] = useState<number>(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const setItemsPerPage = useCallback((limit: number): void => {
    setItemsPerPageState(limit);
    setCurrentPage(1);
  }, []);

  const paginate = useCallback(
    <T,>(items: T[]): T[] => {
      const start = (currentPage - 1) * itemsPerPage;
      return items.slice(start, start + itemsPerPage);
    },
    [currentPage, itemsPerPage],
  );

  const paginationProps = useMemo<CrudPaginationBinding>(
    () => ({
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      onPageChange: setCurrentPage,
      onItemsPerPageChange: setItemsPerPage,
    }),
    [currentPage, totalPages, totalItems, itemsPerPage, setItemsPerPage],
  );

  return { currentPage, itemsPerPage, totalPages, paginate, paginationProps };
}
