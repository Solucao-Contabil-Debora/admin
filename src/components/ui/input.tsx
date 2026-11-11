import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Input Component
 * 
 * Campo de entrada de texto estilizado com suporte completo a tipos HTML.
 * 
 * @example
 * ```tsx
 * <Input type="text" placeholder="Digite seu nome" />
 * <Input type="email" placeholder="email@exemplo.com" />
 * <Input type="password" placeholder="Senha" />
 * <Input showCharCount maxLength={150} placeholder="Com contador" />
 * ```
 */

export interface InputProps extends React.ComponentProps<"input"> {
  showCharCount?: boolean;
}

/**
 * Componente `Input` da lib.
 * @example
 * <Input />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showCharCount, maxLength, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    React.useEffect(() => {
      if (typeof props.value === 'string') {
        setCharCount(props.value.length);
      } else if (typeof props.defaultValue === 'string') {
        setCharCount(props.defaultValue.length);
      }
    }, [props.value, props.defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-xs md:placeholder:text-sm placeholder:text-muted-foreground hover:border-primary focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors md:text-sm text-xs",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCharCount && maxLength && (
          <div className="text-right text-xs text-muted-foreground mt-1">
            {charCount} / {maxLength}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
