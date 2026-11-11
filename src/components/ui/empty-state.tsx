import type { ReactNode } from "react";
import { FileX, Search, AlertCircle } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "search" | "error";
}

const variantIcons = {
  default: FileX,
  search: Search,
  error: AlertCircle,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps): JSX.Element {
  const isCustomIcon = !!icon;
  const VariantIcon = variantIcons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center text-xs",
        className,
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        {isCustomIcon ? (
          icon
        ) : (
          <VariantIcon className="text-muted-foreground text-xs w-[22px] h-[22px]" />
        )}
      </div>

      <h3 className="font-semibold mb-2 text-sm">{title}</h3>

      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm text-xs">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="outline" className="text-xs">
          {action.label}
        </Button>
      )}
    </div>
  );
}
