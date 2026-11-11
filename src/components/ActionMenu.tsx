import { MoreVertical } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'

type ActionMenuItem = {
  label: string
  onClick: () => void
  danger?: boolean
}

type ActionMenuProps = {
  items: ActionMenuItem[]
  width?: string
}

export function ActionMenu({ items, width = 'w-32' }: ActionMenuProps) {
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="subtle" size="icon-sm" aria-label="Ações">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={cn('min-w-0', width)}>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onSelect={item.onClick}
              className={cn(item.danger && 'text-destructive focus:text-destructive')}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
