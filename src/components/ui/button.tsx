import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-input shadow-sm",
        tertiary:
          "bg-background text-foreground hover:bg-accent hover:text-accent-foreground border border-border",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        subtle:
          "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline",
        icon:
          "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground",
        onPrimarySubtle:
          "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 shadow-sm",
        onPrimaryStrong:
          "bg-primary-foreground hover:bg-primary-foreground/90 text-primary font-semibold shadow-sm",
        loading: "bg-primary/50 text-primary-foreground cursor-wait",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 py-2 text-sm rounded-md",
        lg: "h-12 px-8 text-base rounded-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-xs": "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
