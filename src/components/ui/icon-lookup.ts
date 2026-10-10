import type { LucideIcon } from "lucide-react";

/**
 * A few backend-supplied kebab-case icon ids (partner-service.icon: free-text
 * column, e.g. 'building-office') have no literal PascalCase counterpart in
 * lucide-react's export map — alias those to the closest real icon.
 */
const ICON_ALIASES: Record<string, string> = {
  "building-office": "Building2",
};

/**
 * Resolves an icon name against a set of icons keyed by PascalCase name.
 * Handles the app's own PascalCase names (e.g. "Stamp") directly, and
 * normalizes backend-supplied kebab-case ids (e.g. "shield-check" ->
 * "ShieldCheck") so real API data renders instead of silently vanishing.
 */
export function findIcon(set: ReadonlyMap<string, LucideIcon>, name: string): LucideIcon | undefined {
  const exact = set.get(name);
  if (exact) return exact;
  const pascal = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const converted = set.get(pascal);
  if (converted) return converted;
  const alias = ICON_ALIASES[name.toLowerCase()];
  return alias ? set.get(alias) : undefined;
}
