import { PanelLeft } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import logo from "../../assets/logo-black.png";

interface SidebarBrandLogoProps {
  open: boolean;
  onToggle?: () => void;
  href?: string;
}

export const SidebarBrandLogo = ({ open, onToggle }: SidebarBrandLogoProps): JSX.Element => {
  const toggleButton = onToggle ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Alternar barra lateral"
      data-testid="sidebar-toggle"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  ) : null;

  if (open) {
    return (
      <div className="flex h-14 items-center justify-between gap-2 pl-2">
        <img src={logo} alt="Solução Contábil" className="-my-3 h-20 w-auto max-w-[150px] flex-shrink-0 object-contain" />
        {toggleButton}
      </div>
    );
  }

  return (
    <div className="group relative flex h-14 w-full items-center justify-center">
      <div
        className={`h-9 w-9 overflow-hidden rounded ${
          onToggle ? "transition-opacity group-hover:opacity-0 group-focus-within:opacity-0" : ""
        }`}
      >
        <img src={logo} alt="Solução Contábil" className="h-9 w-auto max-w-none" />
      </div>
      {toggleButton && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {toggleButton}
        </div>
      )}
    </div>
  );
};
