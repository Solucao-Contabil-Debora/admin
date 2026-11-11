import * as React from "react";
import { EllipsisVertical } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@shared/lib/utils";

export interface ActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: React.ReactNode;
  variant?: ButtonProps["variant"];
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, children, variant = "icon", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      {children || <EllipsisVertical size={16} />}
    </Button>
  ),
);
ActionButton.displayName = "ActionButton";
