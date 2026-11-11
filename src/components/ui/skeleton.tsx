import { cn } from "@shared/lib/utils"

/**
 * Bloco de carregamento animado (pulse). Use para placeholders de conteúdo durante fetch.
 *
 * Para padrões compostos prontos (tabela, card, formulário, header, sidebar), prefira
 * `TableSkeleton`, `CardSkeleton`, `FormSkeleton`, `HeaderSkeleton`, `SidebarSkeleton`
 * de `./skeleton-variants`.
 *
 * @example
 * ```tsx
 * {isLoading ? <Skeleton className="h-4 w-32" /> : <span>{name}</span>}
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }