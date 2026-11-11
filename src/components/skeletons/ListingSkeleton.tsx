import { Skeleton } from "@shared/components/ui/skeleton";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonBody,
} from "@shared/components/ui/table";
import { useIsMobile } from "@shared/hooks/useMediaQuery";
import { cn } from "@shared/lib/utils";

export type ListingSkeletonVariant = "auto" | "table" | "cards";

export interface ListingSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
  enableSelection?: boolean;
  variant?: ListingSkeletonVariant;
  className?: string;
  headClassName?: string;
  cellClassName?: string;
}

function ListingTableSkeleton({
  rows,
  columns,
  showActions,
  enableSelection,
  headClassName,
  cellClassName,
}: Required<Pick<ListingSkeletonProps, "rows" | "columns" | "showActions" | "enableSelection">> &
  Pick<ListingSkeletonProps, "headClassName" | "cellClassName">): JSX.Element {
  const extra = (showActions ? 1 : 0) + (enableSelection ? 1 : 0);
  const total = columns + extra;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: total }).map((_, i) => (
            <TableHead key={i} className={headClassName}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableSkeletonBody
        rows={rows}
        columns={columns}
        showActions={showActions}
        enableSelection={enableSelection}
        cellClassName={cellClassName}
      />
    </Table>
  );
}

function ListingCardsSkeleton({ rows }: { rows: number }): JSX.Element {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingSkeleton({
  rows = 8,
  columns = 5,
  showActions = true,
  enableSelection = false,
  variant = "auto",
  className,
  headClassName,
  cellClassName,
}: ListingSkeletonProps): JSX.Element {
  const isMobile = useIsMobile();
  const resolved: "table" | "cards" =
    variant === "auto" ? (isMobile ? "cards" : "table") : variant;

  return (
    <div className={cn("w-full", className)}>
      {resolved === "table" ? (
        <ListingTableSkeleton
          rows={rows}
          columns={columns}
          showActions={showActions}
          enableSelection={enableSelection}
          headClassName={headClassName}
          cellClassName={cellClassName}
        />
      ) : (
        <ListingCardsSkeleton rows={rows} />
      )}
    </div>
  );
}
