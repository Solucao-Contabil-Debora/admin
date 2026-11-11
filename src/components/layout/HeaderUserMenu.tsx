import { Fragment, type ReactNode } from "react";
import { ChevronDown, User, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { useSidebar } from "@shared/components/ui/sidebar";

export interface HeaderUserMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "destructive";
  keepOpen?: boolean;
}

interface HeaderUserMenuProps {
  name: string;
  subtitle?: string;
  avatarLabel?: string;
  actions: HeaderUserMenuAction[];
  leading?: ReactNode;
  collapsed?: boolean;
  fitContent?: boolean;
}

export function HeaderUserMenu({
  name,
  subtitle,
  avatarLabel,
  actions,
  leading,
  collapsed: collapsedProp,
  fitContent = false,
}: HeaderUserMenuProps): JSX.Element {
  const { state } = useSidebar();
  const collapsed = collapsedProp ?? state === "collapsed";

  return (
    <div className={`flex items-center gap-2 py-3 ${collapsed ? "justify-center" : fitContent ? "justify-end" : "w-[300px] justify-end"}`}>
      {leading}
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none flex items-center gap-2 min-w-0">
          {collapsed ? (
            <User className="h-5 w-5 text-muted-foreground" />
          ) : (
            <>
              <div className="flex flex-col items-end min-w-0 text-right">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{name}</span>
                {subtitle && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{subtitle}</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {(avatarLabel ?? name ?? "U").trim().charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={collapsed ? "right" : "top"}
          align="start"
          className="w-56 border-border bg-background"
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Fragment key={action.id}>
                {index > 0 && action.tone === "destructive" && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={action.tone === "destructive" ? "text-destructive dark:text-red-400" : undefined}
                  onSelect={(event) => {
                    if (action.keepOpen) event.preventDefault();
                    action.onSelect();
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              </Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
