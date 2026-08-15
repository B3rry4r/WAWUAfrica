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
 * Thin wrapper over lucide-react so components address icons by name,
 * mirroring the design system's Icon primitive.
 */
export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, ...rest }: IconProps) {
  const Cmp = Icons[name] as LucideIcon | undefined;
  if (!Cmp) return null;
  return <Cmp width={size} height={size} color={color} strokeWidth={strokeWidth} {...rest} aria-hidden="true" />;
}