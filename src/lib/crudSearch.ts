export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesSearch(term: string, ...values: Array<string | null | undefined>): boolean {
  const search = normalizeText(term.trim());
  if (!search) return true;
  return values.some((value) => value != null && normalizeText(value).includes(search));
}
