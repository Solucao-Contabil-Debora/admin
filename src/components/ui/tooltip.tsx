/**
 * @module Tooltip
 * Tooltip por hover/focus. Composição: `TooltipProvider` (envolve a árvore — pode ser global)
 * + `Tooltip` (raiz por instância) + `TooltipTrigger` (use `asChild` para reaproveitar elemento)
 * + `TooltipContent` (texto, com `side`, `sideOffset`, etc).
 *
 * `delayDuration` padrão de **300ms** (override do shadcn). Reduz flicker em listas densas.
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@shared/lib/utils"

/**
 * Provider global de tooltips. Envolva a árvore uma única vez (já incluso em `CoreProviders`).
 * `delayDuration` padrão: **300ms**.
 *
 * @example
 * ```tsx
 * <TooltipProvider delayDuration={300}>
 *   <App />
 * </TooltipProvider>
 * ```
 */
const TooltipProvider = ({
  delayDuration = 300,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
)

/**
 * Raiz de uma instância de tooltip. Re-exporta `TooltipPrimitive.Root` do Radix.
 *
 * @example
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger asChild><Button>?</Button></TooltipTrigger>
 *   <TooltipContent>Ajuda</TooltipContent>
 * </Tooltip>
 * ```
 */
const Tooltip = TooltipPrimitive.Root

/**
 * Trigger do tooltip. Use `asChild` para herdar o elemento filho (recomendado para botões/ícones).
 *
 * @example
 * ```tsx
 * <TooltipTrigger asChild>
 *   <Button variant="icon"><Info /></Button>
 * </TooltipTrigger>
 * ```
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Conteúdo do tooltip. Aceita `side` (`top`/`right`/`bottom`/`left`) e `sideOffset` (padrão 4).
 *
 * @example
 * ```tsx
 * <TooltipContent side="right" sideOffset={8}>Texto explicativo</TooltipContent>
 * ```
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
