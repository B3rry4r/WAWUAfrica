import { EmptyState } from "@/components/ui/EmptyState";
import type { IconName } from "@/components/ui/Icon";

/** Temporary scaffold for a flow owned by another dev — replaced by the real screen. */
export function RoutePlaceholder({
  title,
  caption,
  icon = "Wrench",
}: {
  title: string;
  caption: string;
  icon?: string;
}) {
  return <EmptyState icon={icon as IconName} title={title} caption={caption} />;
}