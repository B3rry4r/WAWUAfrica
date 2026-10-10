import type { LucideIcon } from "lucide-react";
import type * as Lucide from "lucide-react";
import type { ComponentProps } from "react";
import { ICON_SET } from "./icon-set.generated";
import { findIcon } from "./icon-lookup";
import { LateIcon } from "./LateIcon";

export type IconName = keyof typeof Lucide;

export interface IconProps extends Omit<ComponentProps<LucideIcon>, "name" | "size" | "color" | "strokeWidth"> {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Thin wrapper over lucide-react so components address icons by name,
 * mirroring the design system's Icon primitive.
 *
 * The icons come from `icon-set.generated.ts`: the ones the app's source names,
 * imported one by one, so a page carries those and not the whole library (the
 * whole library was about 144 kB gzipped on every page, /join included; see
 * scripts/build-icon-set.mjs). A name that is not in that set can only have
 * come from data at run time, and is handed to LateIcon, which fetches the full
 * library after the page has rendered.
 */
export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, ...rest }: IconProps) {
  const Cmp = findIcon(ICON_SET, name);
  if (!Cmp) return <LateIcon name={name} size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
  return <Cmp width={size} height={size} color={color} strokeWidth={strokeWidth} {...rest} aria-hidden="true" />;
}
