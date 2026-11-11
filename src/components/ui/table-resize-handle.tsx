import * as React from "react";
import { cn } from "@shared/lib/utils";

interface TableResizeHandleProps {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  className?: string;
}

export const TableResizeHandle = React.forwardRef<HTMLDivElement, TableResizeHandleProps>(
  ({ direction, onMouseDown, isDragging, className }, ref) => {
    const isHorizontal = direction === "horizontal";

    return (
      <div
        ref={ref}
        onMouseDown={onMouseDown}
        className={cn(
          "absolute z-20 select-none touch-none transition-colors duration-150 group flex items-center justify-center",
          isHorizontal
            ? "top-0 right-0 h-full w-2 -mr-1 cursor-col-resize hover:bg-primary/20"
            : "bottom-0 left-0 w-full h-2 -mb-1 cursor-row-resize hover:bg-primary/20",
          isDragging && "bg-primary/30",
          className,
        )}
      >
        <div
          className={cn(
            "rounded-full bg-border transition-colors group-hover:bg-primary",
            isDragging && "bg-primary",
            isHorizontal ? "h-6 w-0.5" : "w-6 h-0.5",
          )}
        />
      </div>
    );
  },
);
TableResizeHandle.displayName = "TableResizeHandle";
