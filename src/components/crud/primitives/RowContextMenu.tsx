import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@shared/components/ui/context-menu";
import { cn } from "@shared/lib/utils";
import type { CrudRowAction } from "../components/CrudRowActions";
import { ROW_ACTION_TONE_CLASS } from "../components/rowActionTone";

export interface RowContextMenuProps {
  actions?: CrudRowAction[];
  children: React.ReactElement;
}

export function RowContextMenu({ actions, children }: RowContextMenuProps): JSX.Element {
  const visible = actions?.filter((action) => !action.hidden) ?? [];
  if (visible.length === 0) return children;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent onClick={(event) => event.stopPropagation()}>
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <ContextMenuItem
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
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
