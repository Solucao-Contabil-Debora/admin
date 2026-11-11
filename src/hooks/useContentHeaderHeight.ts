import { useLayoutEffect, useRef, type RefObject } from "react";

export function useContentHeaderHeight<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    const sync = () => root.style.setProperty("--content-header-height", `${element.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--content-header-height");
    };
  }, []);

  return ref;
}
