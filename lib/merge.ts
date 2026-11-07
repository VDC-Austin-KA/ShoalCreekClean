export const merge = (tpl: string, v: Record<string, string | null | undefined>) => tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => v[k] ?? "");
