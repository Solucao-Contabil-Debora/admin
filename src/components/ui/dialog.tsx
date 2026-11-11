import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

/**
 * Dialog — Modal acessível baseado em Radix UI Dialog (composição padrão da lib).
 *
 * Estrutura recomendada (obrigatória para garantir scroll e visibilidade do footer):
 *
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent size="md" variant="form" isDirty={form.formState.isDirty}>
 *     <DialogHeader>
 *       <DialogTitle>Editar usuário</DialogTitle>
 *       <DialogDescription>Atualize os dados do usuário.</DialogDescription>
 *     </DialogHeader>
 *     <DialogBody>
 *       {/* conteúdo scrollável *\/}
 *     </DialogBody>
 *     <DialogFooter>
 *       <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
 *       <Button onClick={handleSave}>Salvar</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * **Variantes do `DialogContent`:**
 * - `informative` (default): fecha ao clicar fora ou ESC.
 * - `form`: bloqueia clique fora; com `isDirty=true` exibe alerta "alterações não salvas" ao tentar fechar.
 * - `destructive`: bloqueia clique fora E ESC, oculta o botão de fechar (ações irreversíveis).
 *
 * **Tamanhos pré-definidos:** `sm` (320–480px), `md` (480–720px, default), `lg` (1440px / 85vh).
 * Use `customWidth/customHeight/...` para casos específicos.
 *
 * **Importante:** Sempre embrulhar conteúdo em `<DialogBody>` quando houver `<DialogFooter>` —
 * caso contrário o footer pode ser empurrado para fora do viewport (em dev, um warning é emitido).
 *
 * @see https://ui.shadcn.com/docs/components/dialog
 *
 * @example
 * <Dialog />
 */
const Dialog = DialogPrimitive.Root;

/**
 * Elemento que dispara a abertura do Dialog. Use `asChild` para reaproveitar seu próprio botão.
 *
 * @example
 * <DialogTrigger asChild>
 *   <Button variant="outline">Editar</Button>
 * </DialogTrigger>
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Portal onde o Dialog é renderizado (geralmente `document.body`).
 * Você raramente precisa usar diretamente — `DialogContent` já o utiliza internamente.
 *
 * @example
 * <DialogPortal container={containerRef.current}>
 *   <DialogOverlay />
 *   <DialogContent>...</DialogContent>
 * </DialogPortal>
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * Botão programático para fechar o Dialog. Útil em ações dentro do body/footer.
 * Use `asChild` para envolver seu próprio botão.
 *
 * @example
 * <DialogClose asChild>
 *   <Button variant="outline">Cancelar</Button>
 * </DialogClose>
 */
const DialogClose = DialogPrimitive.Close;

/**
 * Camada semitransparente atrás do Dialog. Renderizada automaticamente pelo `DialogContent` —
 * use diretamente apenas se estiver compondo um Portal customizado.
 *
 * @example
 * <DialogPortal>
 *   <DialogOverlay className="bg-black/60" />
 *   <DialogContent>...</DialogContent>
 * </DialogPortal>
 */
const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({
  className,
  ...props
}, ref) => <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)} {...props} />);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Tamanhos pré-definidos do `DialogContent`:
 * - `sm` — 320–480px, ideal para confirmações curtas.
 * - `md` — 480–720px (default), formulários comuns.
 * - `lg` — 1440px / 85vh, conteúdo extenso (wizards, listas).
 *
 * Para tamanhos arbitrários, use `customWidth/customHeight` em `DialogContentProps`.
 *
 * @example
 * <DialogContent size="lg">...</DialogContent>
 */
type DialogSize = 'sm' | 'md' | 'lg';

/**
 * Variante do `DialogContent`, controla comportamento de fechamento:
 * - `informative` (default) — fecha ao clicar fora ou ESC.
 * - `form` — bloqueia clique fora; com `isDirty=true` confirma "alterações não salvas".
 * - `destructive` — bloqueia ESC e clique fora; oculta o `X` (ações irreversíveis).
 *
 * @example
 * <DialogContent variant="form" isDirty={form.formState.isDirty}>...</DialogContent>
 */
type DialogVariant = 'informative' | 'form' | 'destructive';

interface DialogSizeConfig {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

const dialogSizeStyles: Record<DialogSize, DialogSizeConfig> = {
  sm: {
    width: '30vw',
    minWidth: '320px',
    maxWidth: '480px',
    maxHeight: '320px'
  },
  md: {
    width: '50vw',
    minWidth: '480px',
    maxWidth: '720px',
    maxHeight: '70vh'
  },
  lg: {
    width: '85vw',
    height: '85vh',
    maxWidth: '1440px',
    minHeight: '480px',
    maxHeight: '900px'
  }
};

/**
 * Props do `DialogContent`.
 *
 * @property size — Tamanho pré-definido: `sm`, `md` (default), `lg`. Ignorado se `customWidth/Height` forem usados.
 * @property variant — `informative` (default) | `form` (confirma `isDirty` ao fechar) | `destructive` (bloqueia ESC).
 * @property isDirty — Quando `variant='form'` e `isDirty=true`, exibe AlertDialog de confirmação ao tentar fechar.
 * @property customWidth — Width customizado (ex: `'600px'`, `'40vw'`). Sobrescreve `size`.
 * @property customMaxHeight — Limite de altura. Útil para conteúdo muito longo dentro de `DialogBody`.
 *
 * @example
 * const props: DialogContentProps = {
 *   size: 'lg',
 *   variant: 'form',
 *   isDirty: form.formState.isDirty,
 *   customMaxHeight: '80vh',
 * };
 */
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  variant?: DialogVariant;
  isDirty?: boolean;
  customWidth?: string;
  customMinWidth?: string;
  customMaxWidth?: string;
  customHeight?: string;
  customMinHeight?: string;
  customMaxHeight?: string;
  /** i18n: Title for unsaved changes alert (default: t('unsaved_changes')) */
  unsavedChangesTitle?: string;
  /** i18n: Description for unsaved changes alert */
  unsavedChangesDescription?: string;
  /** i18n: Cancel button text */
  cancelText?: string;
  /** i18n: Leave without saving button text */
  leaveWithoutSavingText?: string;
}

/**
 * Container principal do Dialog. Aplica tamanho, variante e (quando `variant='form'`)
 * o fluxo de confirmação de "alterações não salvas". Sempre coloque
 * `DialogHeader` + `DialogBody` + `DialogFooter` como filhos diretos.
 *
 * @example
 * <DialogContent size="md" variant="form" isDirty={form.formState.isDirty}>
 *   <DialogHeader>
 *     <DialogTitle>Editar usuário</DialogTitle>
 *   </DialogHeader>
 *   <DialogBody>{/* form fields *\/}</DialogBody>
 *   <DialogFooter>
 *     <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
 *     <Button onClick={handleSave}>Salvar</Button>
 *   </DialogFooter>
 * </DialogContent>
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ 
  className, 
  children, 
  size,
  variant = 'informative',
  isDirty,
  customWidth,
  customMinWidth,
  customMaxWidth,
  customHeight,
  customMinHeight,
  customMaxHeight,
  unsavedChangesTitle = "Alterações não salvas",
  unsavedChangesDescription = "Você tem alterações que ainda não foram salvas. Deseja sair mesmo assim?",
  cancelText = "Cancelar",
  leaveWithoutSavingText = "Sair sem salvar",
  style,
  onInteractOutside,
  onEscapeKeyDown,
  ...props 
}, ref) => {
  const [showUnsavedAlert, setShowUnsavedAlert] = React.useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);
  const skipDirtyCheckRef = React.useRef(false);

  const hasCustomDimension = customWidth || customMinWidth || customMaxWidth || customHeight || customMinHeight || customMaxHeight;
  const effectiveSize = size ?? (hasCustomDimension ? undefined : 'md');
  const sizeConfig = effectiveSize ? dialogSizeStyles[effectiveSize] : {};
  
  const computedStyle: React.CSSProperties = {
    ...(customWidth ?? sizeConfig.width ? { width: customWidth ?? sizeConfig.width } : {}),
    ...(customMinWidth ?? sizeConfig.minWidth ? { minWidth: customMinWidth ?? sizeConfig.minWidth } : {}),
    ...(customMaxWidth ?? sizeConfig.maxWidth ? { maxWidth: customMaxWidth ?? sizeConfig.maxWidth } : {}),
    ...(customHeight ?? sizeConfig.height ? { height: customHeight ?? sizeConfig.height } : {}),
    ...(customMinHeight ?? sizeConfig.minHeight ? { minHeight: customMinHeight ?? sizeConfig.minHeight } : {}),
    ...(customMaxHeight ?? sizeConfig.maxHeight ? { maxHeight: customMaxHeight ?? sizeConfig.maxHeight } : {}),
    ...style
  };

  const confirmOrProceed = React.useCallback((action: () => void) => {
    if (variant === 'form' && isDirty) {
      pendingActionRef.current = action;
      setShowUnsavedAlert(true);
    } else {
      action();
    }
  }, [variant, isDirty]);

  const handleInteractOutside = (e: Event) => {
    if (variant === 'form' || variant === 'destructive') {
      e.preventDefault();
      return;
    }
    onInteractOutside?.(e as Parameters<NonNullable<typeof onInteractOutside>>[0]);
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (variant === 'destructive') {
      e.preventDefault();
      return;
    }
    if (variant === 'form' && isDirty) {
      e.preventDefault();
      confirmOrProceed(() => {
        skipDirtyCheckRef.current = true;
        closeBtnRef.current?.click();
      });
      return;
    }
    onEscapeKeyDown?.(e);
  };

  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  const handleCloseClick = (e: React.MouseEvent) => {
    if (skipDirtyCheckRef.current) {
      skipDirtyCheckRef.current = false;
      return;
    }
    if (variant === 'form' && isDirty) {
      e.preventDefault();
      confirmOrProceed(() => {
        skipDirtyCheckRef.current = true;
        closeBtnRef.current?.click();
      });
    }
  };

  const handleAlertConfirm = () => {
    setShowUnsavedAlert(false);
    pendingActionRef.current?.();
    pendingActionRef.current = null;
  };

  const handleAlertCancel = () => {
    setShowUnsavedAlert(false);
    pendingActionRef.current = null;
  };

  const showCloseButton = variant !== 'destructive';

  if (import.meta.env.DEV && children) {
    const childArray = React.Children.toArray(children);
    const hasFooter = childArray.some(
      (child) =>
        React.isValidElement(child) &&
        (child.type as { displayName?: string })?.displayName === 'DialogFooter'
    );
    const hasBody = childArray.some(
      (child) =>
        React.isValidElement(child) &&
        (child.type as { displayName?: string })?.displayName === 'DialogBody'
    );
    if (hasFooter && !hasBody) {
      console.warn(
        '[DialogContent] DialogFooter detected without DialogBody. ' +
        'Wrap your content in <DialogBody> to ensure the footer stays visible and content scrolls correctly.'
      );
    }
  }

  return (
    <>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 flex flex-col translate-x-[-50%] translate-y-[-50%] bg-background p-0 overflow-hidden border shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-xl max-sm:!w-[calc(100vw-2rem)] max-sm:!min-w-0 max-sm:!min-h-0 max-sm:!max-w-none max-sm:!h-auto max-sm:!max-h-[calc(100dvh-2rem)]",
            variant === 'destructive' && "border-t-4 border-t-destructive",
            className
          )}
          style={computedStyle}
          onInteractOutside={handleInteractOutside}
          onEscapeKeyDown={handleEscapeKeyDown}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              ref={closeBtnRef}
              onClick={handleCloseClick}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>

      {/* Fora do DialogPortal de propósito: DialogPortal (Radix) envolve cada filho individualmente
          num Slot que exige forwardRef (React.Children.map + PortalPrimitive asChild). AlertDialog é
          AlertDialogPrimitive.Root, componente função sem forwardRef — dentro do Portal acima gerava
          "Function components cannot be given refs". AlertDialog já porta seu próprio conteúdo via
          AlertDialogContent, não precisa estar aninhado no Portal do Dialog. */}
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {unsavedChangesDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAlertCancel}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm}>{leaveWithoutSavingText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se `true`, exibe uma linha separadora abaixo do título (default: `false`). */
  showSeparator?: boolean;
}

/**
 * Header do Dialog. Contém `DialogTitle` e opcionalmente `DialogDescription`.
 * Sempre o primeiro filho dentro de `DialogContent`. Não rola — fica fixo no topo.
 *
 * @example
 * <DialogHeader showSeparator>
 *   <DialogTitle>Editar usuário</DialogTitle>
 *   <DialogDescription>Atualize os dados abaixo.</DialogDescription>
 * </DialogHeader>
 */
const DialogHeader = ({
  className,
  showSeparator = false,
  children,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      "flex flex-col flex-shrink-0 text-left px-4 pr-14 md:px-6 md:pr-14 pt-5 pb-4",
      showSeparator && "border-b",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
DialogHeader.displayName = "DialogHeader";

/**
 * Container scrollável do Dialog (área entre header e footer).
 *
 * **Obrigatório quando há `DialogFooter`** — sem ele, o footer pode sair do viewport.
 * Usa `px-2 -mx-2` para não recortar focus rings de inputs próximos à borda.
 *
 * @example
 * <DialogBody>
 *   <Form {...form}>
 *     <FormField name="email" render={...} />
 *   </Form>
 * </DialogBody>
 */
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4", className)}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

/**
 * Footer do Dialog com alinhamento à direita, sem borda nem fundo próprio.
 * Tipicamente contém botões de ação (Cancelar, Salvar). Fica fixo no rodapé.
 *
 * @example
 * <DialogFooter>
 *   <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
 *   <Button onClick={handleSave} disabled={form.formState.isSubmitting}>Salvar</Button>
 * </DialogFooter>
 */
const DialogFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-row justify-end gap-3 px-4 md:px-6 py-3 shrink-0",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
DialogFooter.displayName = "DialogFooter";

/**
 * Título do Dialog. Renderizado como `<h2>` com estilo `text-xl font-semibold`.
 * **Obrigatório por acessibilidade** — Radix usa o título para `aria-labelledby` do dialog.
 *
 * @example
 * <DialogTitle>Excluir usuário</DialogTitle>
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Descrição opcional do Dialog (subtítulo). Exibida em texto muted abaixo do título.
 * Mapeada para `aria-describedby` automaticamente pelo Radix.
 *
 * @example
 * <DialogDescription>
 *   Esta ação não pode ser desfeita. O usuário será removido permanentemente.
 * </DialogDescription>
 */
const DialogDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({
  className,
  ...props
}, ref) => <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground mt-1.5", className)} {...props} />);
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription };
export type { DialogVariant, DialogSize, DialogContentProps };
