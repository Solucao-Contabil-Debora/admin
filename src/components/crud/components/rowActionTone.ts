import type { CrudRowAction } from "./CrudRowActions";

export const ROW_ACTION_TONE_CLASS: Record<NonNullable<CrudRowAction["tone"]>, string | undefined> = {
  default: undefined,
  destructive: "text-destructive hover:text-destructive focus:text-destructive",
  success: "text-green-600 hover:text-green-600 focus:text-green-600",
};
