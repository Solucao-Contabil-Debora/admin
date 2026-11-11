import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * CVA com variantes do `Badge`. Exportado para compor estilos em outros componentes.
 * @example
 * <div className={badgeVariants({ variant: 'success' })}>Custom</div>
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        danger:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        info:
          "border-transparent bg-primary/10 text-primary",
        sharp:
          "border-transparent bg-[hsl(78,70%,46%)] text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Tipo `BadgeProps` exportado pela lib.
 * @example
 * const value: BadgeProps = {} as BadgeProps;
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Etiqueta visual compacta para metadados, contagens ou estados estáticos.
 *
 * Variantes:
 * - `default`: marca primária (azul).
 * - `secondary`: neutro suave.
 * - `danger`: erros / ações destrutivas. **Use `danger`, não `destructive`** (padrão da lib).
 * - `outline`: apenas borda, sem fundo.
 * - `success` / `warning` / `info`: feedback semântico.
 * - `sharp`: variante verde-limão de destaque (uso pontual).
 *
 * Para estados dinâmicos de processo (Ativo, Pendente, Concluído), prefira
 * `StatusBadge` da lib (gera cor pastel automaticamente).
 *
 * @example
 * ```tsx
 * <Badge variant="success">Aprovado</Badge>
 * <Badge variant="info">Novo</Badge>
 * ```
 *
 * @see Documentação: `docs/design-system/data-display.md`
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }