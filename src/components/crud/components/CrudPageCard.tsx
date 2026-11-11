import * as React from "react";
import { cn } from "@shared/lib/utils";

export interface CrudPageCardProps {
  actionBar?: React.ReactNode;
  belowBar?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
  contentClassName?: string;
  contentTestId?: string;
  children: React.ReactNode;
}

export function CrudPageCard({
  actionBar,
  belowBar,
  footer,
  loading = false,
  loadingLabel = "Carregando",
  className,
  contentClassName,
  contentTestId,
  children,
}: CrudPageCardProps): JSX.Element {
  return (
    <div className={cn("flex h-full flex-col bg-muted md:m-2 md:h-[calc(100%-1rem)] md:overflow-hidden", className)}>
      {actionBar}

      {belowBar}

      <div className="flex min-h-0 flex-1 flex-col bg-background max-md:bg-muted md:overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-[0_1px_2px_hsl(var(--foreground)/0.05)]">
        <div className="h-0.5 w-full shrink-0 overflow-hidden bg-border/40 max-md:bg-transparent">
          {loading && (
            <div
              role="progressbar"
              aria-busy="true"
              aria-label={loadingLabel}
              className="h-full w-1/3 animate-progress-bounce rounded-full bg-primary"
            />
          )}
        </div>

        <div className={cn("min-h-0 flex-1 overflow-auto bg-card max-md:bg-muted", contentClassName)} data-testid={contentTestId}>
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
