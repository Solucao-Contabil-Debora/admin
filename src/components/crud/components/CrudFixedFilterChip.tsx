import { cn } from "@shared/lib/utils";

export interface CrudFixedFilterChipProps {
  label: string;
  value: string;
  testId?: string;
  className?: string;
}

export function CrudFixedFilterChip({ label, value, testId, className }: CrudFixedFilterChipProps): JSX.Element {
  return (
    <div
      data-testid={testId}
      title={`${label}: ${value}`}
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-3 text-sm",
        className,
      )}
    >
      <span className="shrink-0 font-medium text-foreground">{label}:</span>
      <span className="max-w-[240px] truncate font-semibold text-primary">{value}</span>
    </div>
  );
}
