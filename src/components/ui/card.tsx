/**
 * @module Card
 * Container visual com borda e sombra suave. Composto por:
 * `Card` (raiz) → `CardHeader` (com `CardTitle` + `CardDescription`) → `CardContent` → `CardFooter`.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Resumo do mês</CardTitle>
 *     <CardDescription>Indicadores de abril</CardDescription>
 *   </CardHeader>
 *   <CardContent>{children}</CardContent>
 *   <CardFooter><Button>Ver detalhes</Button></CardFooter>
 * </Card>
 * ```
 *
 * @see `docs/design-system/data-display.md`
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@shared/lib/utils"
import { REVEAL_CLASSES, useReveal } from "@shared/hooks/useReveal"

const cardVariants = cva("bg-card text-card-foreground", {
  variants: {
    variant: {
      default: "rounded-lg border border-border",
      surface: "rounded-2xl border border-border p-6 shadow-[0_1px_2px_hsl(var(--foreground)/0.05)]",
    },
  },
  defaultVariants: { variant: "default" },
})

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  reveal?: boolean
}


type CardVariant = NonNullable<CardProps["variant"]>

const CardVariantContext = React.createContext<CardVariant>("default")

/**
 * Raiz do card. Animação de entrada (fade + escala) na primeira vez que entra na viewport: ativa por padrão
 * em todas as variantes; `reveal={false}` desliga. Respeita `prefers-reduced-motion`.
 * `variant="default"` (`rounded-lg border border-border bg-card`) ou
 * `variant="surface"` (`rounded-2xl`, borda `border-border`, `p-6`, sombra suave — padrão do Financeiro).
 * Na variante `surface`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` e `CardFooter`
 * herdam o padrão visual (sem padding próprio, título `text-sm font-semibold`, subtítulo `text-xs text-muted-foreground`).
 * @example
 * <Card variant="surface"><CardHeader><CardTitle>Resumo</CardTitle></CardHeader></Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, reveal, ...props }, ref) => {
    const { setRef, active, revealState } = useReveal<HTMLDivElement>(reveal ?? true, ref)
    return (
      <CardVariantContext.Provider value={variant ?? "default"}>
        <div
          ref={setRef}
          data-reveal={revealState}
          className={cn(cardVariants({ variant }), active && REVEAL_CLASSES, className)}
          {...props}
        />
      </CardVariantContext.Provider>
    )
  }
)
Card.displayName = "Card"

/**
 * Cabeçalho do card (padding 4, espaçamento vertical 0.5 entre título/descrição).
 * @example
 * <CardHeader><CardTitle>Vendas</CardTitle></CardHeader>
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isSurface = React.useContext(CardVariantContext) === "surface"
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-0.5", isSurface ? "p-0 pb-4" : "p-4", className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

/**
 * Título do card (`<h3>`, text-sm sm:text-base, semibold).
 * @example
 * <CardTitle>Resumo</CardTitle>
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const isSurface = React.useContext(CardVariantContext) === "surface"
  return (
    <h3
      ref={ref}
      className={cn(
        "tracking-tight font-semibold",
        isSurface ? "text-sm text-foreground" : "text-sm sm:text-base",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

/**
 * Descrição/subtítulo do card (text-xs, foreground/70).
 * @example
 * <CardDescription>Últimos 30 dias</CardDescription>
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const isSurface = React.useContext(CardVariantContext) === "surface"
  return (
    <p
      ref={ref}
      className={cn("text-xs", isSurface ? "text-muted-foreground" : "text-foreground/70", className)}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

/**
 * Corpo principal do card. Padding sem top (continua do header).
 * @example
 * <CardContent><p>Conteúdo</p></CardContent>
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isSurface = React.useContext(CardVariantContext) === "surface"
  return <div ref={ref} className={cn(isSurface ? "p-0" : "p-4 pt-0", className)} {...props} />
})
CardContent.displayName = "CardContent"

/**
 * Rodapé do card. Padrão flex-row alinhado ao centro vertical.
 * @example
 * <CardFooter><Button>Ver mais</Button></CardFooter>
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isSurface = React.useContext(CardVariantContext) === "surface"
  return (
    <div
      ref={ref}
      className={cn("flex items-center", isSurface ? "p-0 pt-4" : "p-6 pt-0", className)}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
