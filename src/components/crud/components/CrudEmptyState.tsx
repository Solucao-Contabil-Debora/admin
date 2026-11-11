import * as React from "react";
import { AlertCircle, FileX, Search } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

export interface CrudEntityLabel {
  singular: string;
  plural: string;
  feminine?: boolean;
}

export interface CrudEmptyStateProps {
  entity: CrudEntityLabel;
  searchTerm?: string;
  hasFilters?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  icon?: React.ReactNode;
  description?: string;
  action?: { label: string; onClick: () => void };
}

type EmptyTone = "default" | "search" | "error";

const TONE_ICON: Record<EmptyTone, React.ReactNode> = {
  default: <FileX />,
  search: <Search />,
  error: <AlertCircle />,
};

const TONE_TILE_CLASS: Record<EmptyTone, string> = {
  default: "bg-primary/10 text-primary",
  search: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
};

interface EmptyLayoutProps {
  tone: EmptyTone;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  actionVariant?: "primary" | "outline";
}

function EmptyLayout({ tone, icon, title, description, action, actionVariant = "primary" }: EmptyLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 py-14 text-center">
      <div
        className={cn(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6",
          TONE_TILE_CLASS[tone],
        )}
      >
        {icon ?? TONE_ICON[tone]}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant={actionVariant} size="sm" onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function CrudEmptyState({
  entity,
  searchTerm = "",
  hasFilters = false,
  isError = false,
  onRetry,
  icon,
  description,
  action,
}: CrudEmptyStateProps): JSX.Element {
  const none = entity.feminine ? "Nenhuma" : "Nenhum";
  const suffix = entity.feminine ? "a" : "o";

  if (isError) {
    return (
      <EmptyLayout
        tone="error"
        title={`Não foi possível carregar ${entity.feminine ? "as" : "os"} ${entity.plural}`}
        description="Tente novamente em instantes."
        action={onRetry ? { label: "Tentar novamente", onClick: onRetry } : undefined}
        actionVariant="outline"
      />
    );
  }

  if (searchTerm || hasFilters) {
    return (
      <EmptyLayout
        tone="search"
        icon={icon}
        title={`${none} ${entity.singular} encontrad${suffix}`}
        description={searchTerm ? `Sem resultados para "${searchTerm}".` : "Ajuste os filtros para ver mais resultados."}
      />
    );
  }

  return (
    <EmptyLayout
      tone="default"
      icon={icon}
      title={`${none} ${entity.singular} cadastrad${suffix}`}
      description={description}
      action={action}
    />
  );
}
