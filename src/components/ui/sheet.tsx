import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@shared/lib/utils"
import { Separator } from "./separator"

/**
 * Componente `Sheet` da lib.
 * @example
 * <Sheet />
 */
const Sheet = SheetPrimitive.Root

/**
 * Componente `SheetTrigger` da lib.
 * @example
 * <SheetTrigger />
 */
const SheetTrigger = SheetPrimitive.Trigger

/**
 * Componente `SheetClose` da lib.
 * @example
 * <SheetClose />
 */
const SheetClose = SheetPrimitive.Close

/**
 * Componente `SheetPortal` da lib.
 * @example
 * <SheetPortal />
 */
const SheetPortal = SheetPrimitive.Portal

/**
 * Componente `SheetOverlay` da lib.
 * @example
 * <SheetOverlay />
 */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 flex flex-col bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b max-h-[70vh] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t max-h-[70vh] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> { }

/**
 * Container principal do Sheet. Define o lado de origem da animação via prop `side`
 * (`right` default, `left`, `top`, `bottom`). Já inclui Portal + Overlay + botão `X`.
 *
 * @example
 * <SheetContent side="right" className="sm:max-w-md">
 *   <SheetHeader><SheetTitle>Detalhes</SheetTitle></SheetHeader>
 *   <SheetBody>...</SheetBody>
 * </SheetContent>
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showSeparator?: boolean;
}

/**
 * Header fixo do Sheet (não rola). Contém `SheetTitle` e opcionalmente `SheetDescription`.
 * Use `showSeparator` para adicionar um divisor visual antes do `SheetBody`.
 *
 * @example
 * <SheetHeader showSeparator>
 *   <SheetTitle>Filtros</SheetTitle>
 *   <SheetDescription>Refine sua busca.</SheetDescription>
 * </SheetHeader>
 */
const SheetHeader = ({
  className,
  showSeparator = false,
  children,
  ...props
}: SheetHeaderProps) => (
  <div className={cn("flex flex-col flex-shrink-0", className)} {...props}>
    <div className="flex flex-col text-left">
      {children}
    </div>
    {showSeparator && <Separator className="mt-2" />}
  </div>
)
SheetHeader.displayName = "SheetHeader"

/**
 * Container scrollável do Sheet (área entre header e footer).
 * **Obrigatório quando há `SheetFooter`** — sem ele o footer pode sair do viewport.
 *
 * @example
 * <SheetBody>
 *   {items.map(it => <Card key={it.id}>{it.name}</Card>)}
 * </SheetBody>
 */
const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 min-h-0 overflow-auto py-4 px-1 -mx-1", className)}
    {...props}
  />
)
SheetBody.displayName = "SheetBody"

/**
 * Footer fixo do Sheet com separador automático e alinhamento à direita.
 *
 * @example
 * <SheetFooter>
 *   <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
 *   <Button onClick={save}>Salvar</Button>
 * </SheetFooter>
 */
const SheetFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex-shrink-0 pt-4">
    <Separator className="mb-4" />
    <div
      className={cn(
        "flex flex-row justify-end gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  </div>
)
SheetFooter.displayName = "SheetFooter"

/**
 * Título do Sheet. **Obrigatório por acessibilidade** (`aria-labelledby`).
 * Use `className="sr-only"` se precisar ocultar visualmente.
 *
 * @example
 * <SheetTitle>Editar perfil</SheetTitle>
 */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

/**
 * Descrição opcional do Sheet (subtítulo). Mapeada para `aria-describedby`.
 *
 * @example
 * <SheetDescription>Altere as configurações da sua conta.</SheetDescription>
 */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetBody, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}
