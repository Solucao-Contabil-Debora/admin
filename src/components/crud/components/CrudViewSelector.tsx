import * as React from "react";
import { Check, ChevronDown, ListFilter } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@shared/components/ui/popover";
import { cn } from "@shared/lib/utils";

export interface CrudViewOption {
  value: string;
  label: string;
  count?: number;
  onSelect?: () => void;
  testId?: string;
}

export interface CrudViewGroup {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CrudViewOption[];
}

export interface CrudViewPanel {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: React.ReactNode;
}

interface CrudViewSelectorBase {
  triggerLabel?: string;
  triggerCount?: number;
  triggerTestId?: string;
  panel?: CrudViewPanel;
}

export type CrudViewSelector = CrudViewSelectorBase &
  (
    | { value: string; onChange: (value: string) => void; options: CrudViewOption[]; groups?: undefined }
    | { groups: CrudViewGroup[]; value?: undefined; onChange?: undefined; options?: undefined }
  );


function ViewOptionItem({
  option,
  selected,
  onChoose,
}: {
  option: CrudViewOption;
  selected: boolean;
  onChoose: () => void;
}): JSX.Element {
  return (
    <DropdownMenuItem onSelect={option.onSelect ?? onChoose} className="gap-2" data-testid={option.testId}>
      <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
      <span className="flex-1">{option.label}</span>
      {option.count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
      )}
    </DropdownMenuItem>
  );
}

export function ViewSelector(props: CrudViewSelector): JSX.Element {
  const { groups, panel, triggerTestId } = props;
  const singleOptions: CrudViewOption[] = props.groups ? [] : props.options;
  const atualSimples = singleOptions.find((option) => option.value === props.value) ?? singleOptions[0];
  const label = props.triggerLabel ?? atualSimples?.label;
  const count = props.triggerCount ?? atualSimples?.count;

  return (
    <Popover open={panel?.open ?? false} onOpenChange={panel?.onOpenChange}>
      <DropdownMenu>
        <PopoverAnchor asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 px-3 max-sm:min-w-0 max-sm:flex-1 max-sm:justify-start sm:shrink-0"
              data-testid={triggerTestId}
            >
              <ListFilter className="text-muted-foreground" />
              <span className="truncate font-semibold">{label}</span>
              {count !== undefined && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[11px] tabular-nums">
                  {count}
                </Badge>
              )}
              <ChevronDown className="text-muted-foreground max-sm:ml-auto" />
            </Button>
          </DropdownMenuTrigger>
        </PopoverAnchor>
        <DropdownMenuContent
          align="start"
          className="min-w-[200px]"
          onCloseAutoFocus={(evento) => {
            if (panel?.open) evento.preventDefault();
          }}
        >
          {groups
            ? groups.map((group, index) => (
                <React.Fragment key={group.key}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs font-medium uppercase text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.options.map((option) => (
                    <ViewOptionItem
                      key={option.value}
                      option={option}
                      selected={option.value === group.value}
                      onChoose={() => group.onChange(option.value)}
                    />
                  ))}
                </React.Fragment>
              ))
            : singleOptions.map((option) => (
                <ViewOptionItem
                  key={option.value}
                  option={option}
                  selected={option.value === props.value}
                  onChoose={() => props.onChange?.(option.value)}
                />
              ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {panel && (
        <PopoverContent align="start" className="w-72 p-2">
          {panel.content}
        </PopoverContent>
      )}
    </Popover>
  );
}
