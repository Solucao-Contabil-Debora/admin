/**
 * @module AlertDialog
 * Diálogo modal **não-dismissable** para confirmação de ações destrutivas/irreversíveis
 * (excluir, descartar). Difere de `Dialog`: não pode ser fechado clicando fora ou ESC sem
 * uma escolha explícita (`AlertDialogAction` ou `AlertDialogCancel`).
 *
 * Para diálogos de formulário, edição ou exibição livre de conteúdo, use `Dialog`.
 *
 * @example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger asChild><Button variant="destructive">Excluir</Button></AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
 *       <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancelar</AlertDialogCancel>
 *       <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 *
 * @see `docs/design-system/dialogs.md`
 */
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

/**
 * Raiz do AlertDialog. Controla estado open/onOpenChange.
 * @example
 * <AlertDialog open={open} onOpenChange={setOpen}>...</AlertDialog>
 */
const AlertDialog = AlertDialogPrimitive.Root

/**
 * Elemento que dispara a abertura do AlertDialog. Use `asChild` para customizar.
 * @example
 * <AlertDialogTrigger asChild><Button variant="destructive">Excluir</Button></AlertDialogTrigger>
 */
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/**
 * Portal que renderiza o conteúdo fora da árvore DOM atual.
 * @example
 * <AlertDialogPortal><AlertDialogOverlay /><AlertDialogContent>...</AlertDialogContent></AlertDialogPortal>
 */
const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * Overlay escuro renderizado atrás do conteúdo. Usado internamente por `AlertDialogContent`.
 * @example
 * <AlertDialogPortal><AlertDialogOverlay /></AlertDialogPortal>
 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * Container do conteúdo modal centralizado. Inclui automaticamente Portal e Overlay.
 * @example
 * <AlertDialogContent><AlertDialogHeader>...</AlertDialogHeader></AlertDialogContent>
 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl max-sm:!w-[calc(100vw-3rem)] max-sm:!max-w-none",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/**
 * Cabeçalho do AlertDialog. Agrupa `AlertDialogTitle` e `AlertDialogDescription`.
 * @example
 * <AlertDialogHeader><AlertDialogTitle>Confirmar</AlertDialogTitle></AlertDialogHeader>
 */
const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 py-2 text-center sm:py-0 sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

/**
 * Rodapé do AlertDialog. Alinha botões de ação à direita em desktop.
 * @example
 * <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
 */
const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

/**
 * Título do AlertDialog (text-lg, font-semibold).
 * @example
 * <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
 */
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

/**
 * Descrição/contexto da ação (text-sm, muted).
 * @example
 * <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
 */
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

/**
 * Botão de ação confirmatória. Estiliza com `buttonVariants()` padrão.
 * @example
 * <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

/**
 * Botão de cancelamento (variante outline). Fecha o dialog sem confirmar.
 * @example
 * <AlertDialogCancel>Cancelar</AlertDialogCancel>
 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}