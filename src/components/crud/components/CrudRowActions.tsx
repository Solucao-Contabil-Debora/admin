import * as React from "react";
import { ActionButton } from "@shared/components/ui/action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { cn } from "@shared/lib/utils";
import { ROW_ACTION_TONE_CLASS } from "./rowActionTone";

export interface CrudRowAction {
  label: string;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive" | "success";
  disabled?: boolean;
  hidden?: boolean;
  testId?: string;
}

export interface CrudRowActionsProps {
  actions: CrudRowAction[];
  label?: string;
  className?: string;
  triggerTestId?: string;
}

export function CrudRowActions({
  actions,
  label = "Ações",
  className = "flex items-center justify-center",
  triggerTestId,
}: CrudRowActionsProps): JSX.Element {
  const visible = actions.filter((action) => !action.hidden);

  if (visible.length === 0) {
    return (
      <div className={className}>
        <ActionButton aria-label={label} className="opacity-50" data-testid={triggerTestId} disabled />
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ActionButton aria-label={label} data-testid={triggerTestId} onClick={(event) => event.stopPropagation()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visible.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.label}
                disabled={action.disabled}
                data-testid={action.testId}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onSelect();
                }}
                className={cn("cursor-pointer", ROW_ACTION_TONE_CLASS[action.tone ?? "default"])}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
