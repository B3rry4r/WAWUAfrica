import { eventDateParts } from "@/lib/event-date";
import { EVENT_FORMAT_LABEL, EVENT_TYPE_LABEL, type EventFormat, type EventStatus, type EventType } from "@/types/events";
import { Icon, StatusPill } from "@/components/ui";

/**
 * The small shared pieces every Events surface repeats: the date block, the
 * format pill, the "this week" flag and the host-side status pill.
 *
 * These are ports of the old app's EventsUI helpers (WAWUAfrica-new
 * src/components/events/EventsUI.tsx) with the same geometry and the same
 * meaning — redrawn in Tailwind on tokens, because that file was inline
 * styles on a `w.*` object and hardcoded `rgba()` tints, neither of which is
 * the house style here.
 */

const DATE_BLOCK = {
  sm: { box: "w-[48px] py-[8px]", month: "text-[9px]", day: "text-[19px]" },
  md: { box: "w-[56px] py-[10px]", month: "text-[10px]", day: "text-[22px]" },
  lg: { box: "w-[72px] py-[12px]", month: "text-[12px]", day: "text-[30px]" },
} as const;

export function EventDateBlock({
  startsAt,
  size = "md",
  dim = false,
}: {
  startsAt: string;
  size?: keyof typeof DATE_BLOCK;
  dim?: boolean;
}) {
  const { month, day, full } = eventDateParts(startsAt);
  const s = DATE_BLOCK[size];
  return (
    <span
      title={full}
      className={`flex shrink-0 flex-col items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] text-[var(--text-on-accent)] ${s.box} ${
        dim ? "opacity-50" : ""
      }`}
    >
      <span className={`font-semibold uppercase tracking-[0.08em] opacity-80 ${s.month}`}>{month}</span>
      <span className={`font-bold leading-none ${s.day}`}>{day}</span>
    </span>
  );
}

export function EventFormatPill({ format }: { format: EventFormat }) {
  return (
    <span className="inline-flex h-[24px] items-center gap-[5px] whitespace-nowrap rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[9px] text-[11px] font-semibold text-[var(--text-secondary)]">
      <Icon name={format === "online" ? "Video" : "MapPin"} size={12} color="var(--text-muted)" />
      {EVENT_FORMAT_LABEL[format]}
    </span>
  );
}

export function EventTypePill({ type }: { type: EventType }) {
  return (
    <span className="inline-flex h-[24px] items-center whitespace-nowrap rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[9px] text-[11px] font-semibold text-[var(--text-secondary)]">
      {EVENT_TYPE_LABEL[type]}
    </span>
  );
}

export function ThisWeekPill() {
  return (
    <StatusPill kind="info" size="sm">
      This week
    </StatusPill>
  );
}

/**
 * Host-side only. Nobody browsing the calendar ever sees one of these: the
 * public list is `published` rows and nothing else.
 */
const STATUS_COPY: Record<EventStatus, { kind: "neutral" | "success" | "danger" | "warning"; label: string }> = {
  pending: { kind: "warning", label: "In review" },
  published: { kind: "success", label: "On the calendar" },
  rejected: { kind: "danger", label: "Not approved" },
  removed: { kind: "neutral", label: "Taken down" },
};

export function EventStatusPill({ status }: { status: EventStatus }) {
  const s = STATUS_COPY[status];
  return (
    <StatusPill kind={s.kind} size="sm">
      {s.label}
    </StatusPill>
  );
}

/** The one sentence that explains what "Going" is, wherever the control appears. */
export const GOING_EXPLAINER =
  "Going marks your interest here so the organiser can see the room. If they run a registration, it happens on their own page.";
