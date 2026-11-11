import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import type { PaginationProps } from "@shared/components/types/crud";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  variant = "full",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  filterLabel,
}: PaginationProps): JSX.Element {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages || totalPages === 0;

  return (
    <div
      className="flex flex-row items-center justify-between gap-4 px-4 sm:px-6 text-sm text-muted-foreground bg-card max-md:bg-muted border-t border-border flex-shrink-0"
      style={{ height: "53.11px" }}
    >
      <div className="flex items-center gap-2">
        {variant === "full" && (
          <>
            <span className="hidden sm:inline whitespace-nowrap">
              Registros por página
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-auto h-8 gap-1 px-2.5 min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <span className="hidden sm:inline text-muted-foreground">
        {startItem}-{endItem} de {totalItems} itens
        {filterLabel ? ` · Filtro: ${filterLabel}` : ""}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-2 text-foreground">
          {currentPage} de {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { Pagination as CrudPrimitivePagination };
export default Pagination;
