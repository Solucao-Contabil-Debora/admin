import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const labelVariants = cva(
  "font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[13px]"
)

/**
 * Label Component
 * 
 * Componente de rótulo acessível baseado em Radix UI.
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 * ```
 * 
 * ## Características
 * - Associação automática com campos de formulário via htmlFor/id
 * - Suporte a estados disabled (opacidade reduzida)
 * - Acessibilidade completa
 * 
 * @see https://www.radix-ui.com/docs/primitives/components/label
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }