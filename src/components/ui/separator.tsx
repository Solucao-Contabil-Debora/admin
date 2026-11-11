import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@shared/lib/utils"

/**
 * Linha divisória horizontal (default) ou vertical.
 *
 * @param orientation `"horizontal"` (default) | `"vertical"`. Vertical exige altura definida no pai.
 * @param decorative Quando `true` (default), recebe `aria-hidden`. Defina `false` apenas se a separação
 *   tiver significado semântico para leitores de tela.
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" className="h-6" />
 * ```
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }