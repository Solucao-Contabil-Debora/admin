import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useNavigation } from "@shared/contexts/NavigationContext";

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

/** Substitui o `Link` do react-router: o admin navega por estado, sem rotas. */
export function Link({ to, onClick, children, ...props }: LinkProps) {
  const { navigate } = useNavigation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={`#${to}`} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export function useLocation(): { pathname: string } {
  return { pathname: useNavigation().activePath };
}
