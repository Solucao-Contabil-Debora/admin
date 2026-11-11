import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover";
import { cn } from "@shared/lib/utils";
import { normalizeText } from "@shared/lib/crudSearch";
import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { ViewSelector, type CrudViewSelector } from "./CrudViewSelector";

export type { CrudViewGroup, CrudViewOption, CrudViewPanel, CrudViewSelector } from "./CrudViewSelector";

export interface CrudFilterOption {
  value: string;
  label: string;
}

export interface CrudFilterDef {
  key: string;
  label: string;
  options: CrudFilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  defaultVisible?: boolean;
  required?: boolean;
  testId?: string;
}

const MAX_NOMES_NO_CHIP = 2;

const valoresDoFiltro = (filter: CrudFilterDef): string[] => {
  return filter.multiple ? (filter.values ?? []) : filter.value !== null ? [filter.value] : [];
};

const rotuloSelecao = (filter: CrudFilterDef): string | null => {
  const valores = valoresDoFiltro(filter);
  if (valores.length === 0) return null;
  if (!filter.multiple) return filter.options.find((option) => option.value === valores[0])?.label ?? null;
  if (valores.length > MAX_NOMES_NO_CHIP) return `${valores.length} selecionadas`;
  return filter.options
    .filter((option) => valores.includes(option.value))
    .map((option) => option.label)
    .join(", ");
};

export interface CrudMoreAction {
  label: string;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  destructive?: boolean;
  testId?: string;
}

export interface CrudActionBarV2Props {
  viewSelector?: CrudViewSelector;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchShortcut?: string;

  filters?: CrudFilterDef[];

  columnsSlot?: React.ReactNode;
  moreActions?: CrudMoreAction[];

  onNew?: () => void;
  newButtonLabel?: string;
  newButtonIcon?: React.ComponentType<{ className?: string }>;
  newShortcut?: string;
  newButtonTestId?: string;
  moreActionsTestId?: string;
  searchTestId?: string;

  className?: string;
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

const hasOpenOverlay = (): boolean =>
  document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]') !== null;

function Kbd({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-sans text-[11px] font-medium leading-none",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

interface SearchableListProps {
  items: CrudFilterOption[];
  selectedValue?: string | null;
  selectedValues?: string[];
  multiple?: boolean;
  onSelect: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  inputTestId?: string;
  itemTestId?: (value: string) => string;
}

function SearchableList({
  items,
  selectedValue,
  selectedValues = [],
  multiple = false,
  onSelect,
  onClear,
  placeholder = "Buscar...",
  inputTestId,
  itemTestId,
}: SearchableListProps): JSX.Element {
  const [termo, setTermo] = useState<string>("");
  const [ativo, setAtivo] = useState<number>(0);
  const listaRef = useRef<HTMLDivElement>(null);

  const filtrados = useMemo(() => {
    const busca = normalizeText(termo.trim());
    return busca ? items.filter((item) => normalizeText(item.label).includes(busca)) : items;
  }, [items, termo]);

  useEffect(() => {
    setAtivo(0);
  }, [termo]);

  useEffect(() => {
    listaRef.current?.querySelector<HTMLElement>(`[data-index="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAtivo((atual) => Math.min(atual + 1, filtrados.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAtivo((atual) => Math.max(atual - 1, 0));
    } else if (event.key === "Enter" && filtrados[ativo]) {
      event.preventDefault();
      onSelect(filtrados[ativo].value);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={termo}
          placeholder={placeholder}
          data-testid={inputTestId}
          onChange={(event) => setTermo(event.target.value)}
          onKeyDown={onKeyDown}
          className="h-10 w-full bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {termo && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setTermo("")}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div ref={listaRef} className="max-h-[260px] overflow-auto p-1">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-2 py-6 text-center text-muted-foreground">
            <Search className="h-5 w-5 opacity-50" />
            <span className="text-sm">Nenhum resultado</span>
          </div>
        ) : (
          filtrados.map((item, index) => {
            const selecionado = multiple ? selectedValues.includes(item.value) : item.value === selectedValue;
            return (
              <button
                key={item.value}
                type="button"
                role={multiple ? "checkbox" : undefined}
                aria-checked={multiple ? selecionado : undefined}
                data-testid={itemTestId?.(item.value)}
                data-index={index}
                onClick={() => onSelect(item.value)}
                onMouseEnter={() => setAtivo(index)}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
                  index === ativo && "bg-accent",
                  selecionado && "font-medium text-primary",
                )}
              >
                {multiple && (
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      selecionado ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {selecionado && <Check className="h-3 w-3" />}
                  </span>
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {!multiple && selecionado && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {onClear && (multiple ? selectedValues.length > 0 : selectedValue) && (
        <div className="border-t p-1">
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar filtro
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  filter,
  onRemove,
  defaultOpen = false,
}: {
  filter: CrudFilterDef;
  onRemove: () => void;
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const selecionada = rotuloSelecao(filter);
  const limpar = (): void => {
    if (filter.multiple) filter.onValuesChange?.([]);
    else filter.onChange(null);
  };
  const alternar = (valor: string): void => {
    if (!filter.multiple) {
      filter.onChange(valor === filter.value && !filter.required ? null : valor);
      setOpen(false);
      return;
    }
    const atuais = valoresDoFiltro(filter);
    filter.onValuesChange?.(atuais.includes(valor) ? atuais.filter((item) => item !== valor) : [...atuais, valor]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "inline-flex h-8 items-center rounded-lg border text-sm transition-colors",
          selecionada ? "border-primary/25 bg-primary/10" : "border-dashed border-border bg-background",
        )}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={filter.testId}
            className={cn(
              "inline-flex h-full items-center gap-1.5 rounded-lg pl-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selecionada ? "pr-1.5 hover:bg-primary/5" : "pr-3 hover:bg-accent/50",
            )}
          >
            {selecionada ? (
              <>
                <span className="font-medium text-foreground">{filter.label}:</span>
                <span className="max-w-[240px] truncate font-semibold text-primary">{selecionada}</span>
              </>
            ) : (
              <>
                <span>{filter.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            )}
          </button>
        </PopoverTrigger>
        {!filter.required && (selecionada || !filter.defaultVisible) && (
          <button
            type="button"
            aria-label={selecionada ? `Limpar filtro ${filter.label}` : `Remover filtro ${filter.label}`}
            data-testid={filter.testId ? `${filter.testId}-remover` : undefined}
            onClick={() => {
              limpar();
              if (!selecionada || filter.multiple) onRemove();
            }}
            className={cn(
              "mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground",
              selecionada ? "hover:bg-primary/10" : "hover:bg-accent",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
        <PopoverContent align="start" className="w-[260px] max-w-[calc(100vw-2rem)] overflow-hidden p-0 shadow-lg">
          <SearchableList
            items={filter.options}
            selectedValue={filter.value}
            selectedValues={filter.values}
            multiple={filter.multiple}
            placeholder={`Buscar ${filter.label.toLowerCase()}...`}
            inputTestId={filter.testId ? `${filter.testId}-busca` : undefined}
            itemTestId={(valor) => `filtro-opcao-${filter.key}-${valor}`}
            onSelect={alternar}
            onClear={
              filter.required
                ? undefined
                : () => {
                    limpar();
                    setOpen(false);
                  }
            }
          />
        </PopoverContent>
    </Popover>
  );
}

function CrudActionBarV2Component({
  viewSelector,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Pesquisar",
  searchShortcut = "/",
  filters = [],
  columnsSlot,
  moreActions = [],
  onNew,
  newButtonLabel = "Novo",
  newButtonIcon: NewIcon = Plus,
  newShortcut = "N",
  newButtonTestId,
  moreActionsTestId,
  searchTestId,
  className,
}: CrudActionBarV2Props): JSX.Element {
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [adicionados, setAdicionados] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [recemAdicionado, setRecemAdicionado] = useState<string | null>(null);

  const visiveis = useMemo(
    () =>
      filters.filter(
        (filter) =>
          filter.defaultVisible || valoresDoFiltro(filter).length > 0 || adicionados.includes(filter.key),
      ),
    [filters, adicionados],
  );
  const ocultos = useMemo(
    () => filters.filter((filter) => !visiveis.includes(filter)),
    [filters, visiveis],
  );

  const removerFiltro = useCallback((key: string): void => {
    setAdicionados((prev) => prev.filter((item) => item !== key));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || hasOpenOverlay()) return;
      const tecla = event.key.toLowerCase();
      if (onSearchChange && tecla === searchShortcut.toLowerCase()) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (onNew && tecla === newShortcut.toLowerCase()) {
        event.preventDefault();
        onNew();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onNew, onSearchChange, searchShortcut, newShortcut]);

  const temFiltros = filters.length > 0;
  const isCompact = useMediaQuery("(max-width: 639px)");

  const filtersStrip = temFiltros ? (
      <div
        className={cn(
          isCompact ? "-mx-4 flex basis-full items-center gap-2 overflow-x-auto px-4 pb-0.5 [&>*]:shrink-0" : "contents",
        )}
      >
        {visiveis.map((filter) => (
          <FilterChip
            key={filter.key}
            filter={filter}
            defaultOpen={filter.multiple === true && filter.key === recemAdicionado}
            onRemove={() => removerFiltro(filter.key)}
          />
        ))}

        {ocultos.length > 0 && (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button variant="subtle" size="sm" className="h-8 gap-1.5 px-2.5" data-testid="filtro-adicionar">
                <Plus />
                Filtro
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[240px] max-w-[calc(100vw-2rem)] overflow-hidden p-0 shadow-lg"
              onCloseAutoFocus={(event) => {
                if (filters.some((filter) => filter.key === recemAdicionado && filter.multiple)) event.preventDefault();
              }}
            >
              <SearchableList
                items={ocultos.map((filter) => ({ value: filter.key, label: filter.label }))}
                placeholder="Buscar campo..."
                inputTestId="filtro-campo-busca"
                itemTestId={(key) => `filtro-campo-${key}`}
                onSelect={(key) => {
                  setAdicionados((prev) => [...prev, key]);
                  setRecemAdicionado(key);
                  setAddOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
  ) : null;

  return (
    <div className={cn("flex-shrink-0 flex items-start gap-2 px-4 py-2 bg-muted border-b max-md:border-b-0 max-sm:flex-wrap", className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {viewSelector && <ViewSelector {...viewSelector} />}

        {onSearchChange && (
          <div className="relative order-last w-full basis-full sm:order-none sm:max-w-xs sm:basis-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              placeholder={searchPlaceholder}
              data-testid={searchTestId}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  if (searchValue) onSearchChange("");
                  else searchRef.current?.blur();
                }
              }}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchValue ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  onSearchChange("");
                  searchRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              !searchFocused && (
                <Kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 bg-background text-muted-foreground sm:inline-flex">
                  {searchShortcut}
                </Kbd>
              )
            )}
          </div>
        )}

        {!isCompact && filtersStrip}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {columnsSlot}

        {moreActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="h-9 w-9"
                aria-label="Mais ações"
                data-testid={moreActionsTestId}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {moreActions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.label}
                    disabled={action.disabled}
                    onSelect={action.onSelect}
                    data-testid={action.testId}
                    className={cn(action.destructive && "text-destructive focus:text-destructive")}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onNew && (
          <Button
            onClick={onNew}
            aria-label={newButtonLabel}
            data-testid={newButtonTestId}
            className="h-9 gap-2 px-3 max-sm:w-9 max-sm:px-0"
          >
            <NewIcon />
            <span className="max-sm:sr-only">{newButtonLabel}</span>
            <Kbd className="hidden border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground sm:inline-flex">
              {newShortcut}
            </Kbd>
          </Button>
        )}
      </div>
      {isCompact && filtersStrip}
    </div>
  );
}

export const CrudActionBarV2 = memo(CrudActionBarV2Component);

export default CrudActionBarV2;
