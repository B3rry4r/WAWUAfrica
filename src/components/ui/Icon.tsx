import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import type { ComponentProps } from "react";

export type IconName = keyof typeof Icons;

interface IconProps extends Omit<ComponentProps<LucideIcon>, "name" | "size" | "color" | "strokeWidth"> {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * A few backend-supplied kebab-case icon ids (partner-service.icon: free-text
 * column, e.g. 'building-office') have no literal PascalCase counterpart in
 * lucide-react's export map — alias those to the closest real icon.
 */
const ICON_ALIASES: Record<string, string> = {
  "building-office": "Building2",
};

/**
 * Resolves an icon name against lucide-react's PascalCase export map.
 * Handles the app's own PascalCase names (e.g. "Stamp") directly, and
 * normalizes backend-supplied kebab-case ids (e.g. "shield-check" ->
 * "ShieldCheck") so real API data renders instead of silently vanishing.
 */
function resolveIcon(name: string): LucideIcon | undefined {
  const exact = Icons[name as keyof typeof Icons] as LucideIcon | undefined;
  if (exact) return exact;
  const pascal = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const converted = Icons[pascal as keyof typeof Icons] as LucideIcon | undefined;
  if (converted) return converted;
  const alias = ICON_ALIASES[name.toLowerCase()];
  return alias ? (Icons[alias as keyof typeof Icons] as LucideIcon | undefined) : undefined;
}

/**
 * Thin wrapper over lucide-react so components address icons by name,
 * mirroring the design system's Icon primitive.
 */
export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, ...rest }: IconProps) {
  const Cmp = resolveIcon(name);
  if (!Cmp) return null;
  return <Cmp width={size} height={size} color={color} strokeWidth={strokeWidth} {...rest} aria-hidden="true" />;
}