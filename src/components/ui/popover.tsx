import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@shared/lib/utils"

/**
 * Popover Components
 * 
 * Componentes para criar popovers (menus flutuantes) acessíveis.
 * 
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button variant="outline">{t('open_popover')}</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <div className="space-y-2">
 *       <h4 className="font-medium">Título</h4>
 *       <p className="text-sm text-muted-foreground">Conteúdo do popover</p>
 *     </div>
 *   </PopoverContent>
 * </Popover>
 * ```
 * 
 * ## Características
 * - Posicionamento automático e inteligente
 * - Animações de entrada/saída
 * - Acessibilidade completa (foco, ESC para fechar)
 * - Portal para evitar problemas de z-index
 * 
 * ## Componentes
 * - `Popover`: Container raiz
 * - `PopoverTrigger`: Elemento que abre o popover
 * - `PopoverContent`: Conteúdo do popover
 * 
 * @see https://www.radix-ui.com/docs/primitives/components/popover
 */
const Popover = PopoverPrimitive.Root

/**
 * Componente `PopoverTrigger` da lib.
 * @example
 * <PopoverTrigger />
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Componente `PopoverAnchor` da lib.
 * @example
 * <PopoverAnchor />
 */
const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * PopoverContent
 * 
 * Container do conteúdo do popover com animações e posicionamento.
 * 
 * @param align - Alinhamento horizontal (start, center, end)
 * @param sideOffset - Distância do trigger em pixels
 *
 * @example
 * <PopoverContent />
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    container?: HTMLElement | null;
  }
>(({ className, align = "center", sideOffset = 4, container, ...props }, ref) => (
  <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }