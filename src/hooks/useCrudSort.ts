import { useCallback, useState } from "react";

export type CrudSortDirection = "asc" | "desc";

export interface UseCrudSortOptions {
  field?: string;
  direction?: CrudSortDirection;
}

export interface UseCrudSortReturn {
  sortField: string | undefined;
  sortDirection: CrudSortDirection;
  onSort: (field: string) => void;
  signature: string;
}

export function useCrudSort({ field, direction = "asc" }: UseCrudSortOptions = {}): UseCrudSortReturn {
  const [sortField, setSortField] = useState<string | undefined>(field);
  const [sortDirection, setSortDirection] = useState<CrudSortDirection>(direction);

  const onSort = useCallback(
    (next: string): void => {
      if (sortField === next) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        return;
      }
      setSortField(next);
      setSortDirection("asc");
    },
    [sortField],
  );

  return { sortField, sortDirection, onSort, signature: `${sortField ?? ""}:${sortDirection}` };
}
