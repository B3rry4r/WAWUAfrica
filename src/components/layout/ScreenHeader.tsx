"use client";

import type { ReactNode } from "react";
import { FlowHeader } from "./FlowHeader";

/**
 * Sub-screen header: back control + title + optional right slot.
 *
 * This was a second, hand-written copy of FlowHeader — same 34px round back
 * button, same 12px gap, same flex-1 16px semibold title, same right slot —
 * differing only in being sticky and in a couple of pixels of padding. Two
 * copies meant two geometries, which is half of why header heights and title
 * insets varied across the app. It is now a thin alias so both names keep
 * working and there is exactly one bar to change.
 */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return <FlowHeader title={title} right={right} sticky />;
}
