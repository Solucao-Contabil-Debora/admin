import { useState, useEffect } from "react";

const DEFAULT_DELAY = 500;

export function useDebounce<T>(value: T, delay: number = DEFAULT_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
