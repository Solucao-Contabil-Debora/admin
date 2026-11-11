import { useDebounce } from "@shared/hooks/useDebounce";
import { useState } from "react";

export interface UseCrudSearchReturn {
  value: string;
  onChange: (value: string) => void;
  term: string;
  isSearching: boolean;
}

export function useCrudSearch(delay: number = 300): UseCrudSearchReturn {
  const [value, onChange] = useState<string>("");
  const term = useDebounce(value, delay);
  return { value, onChange, term, isSearching: value !== term };
}
