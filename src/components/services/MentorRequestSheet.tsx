"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { requestMentor } from "@/lib/api/mentors";
import { Avatar, Button, Icon, Sheet } from "@/components/ui";

type Phase = "idle" | "processing" | "done";
type TimeOfDay = "morning" | "evening";

interface DayOption {
  iso: string;
  weekday: string;
  date: number;
}

/** The next few weekdays, for the "which day suits you?" picker. Mentors are
 *  volunteers on ordinary schedules — no session-length inventory to check. */
function upcomingWeekdays(count: number): DayOption[] {
  const options: DayOption[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (options.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      options.push({
        iso: cursor.toISOString().slice(0, 10),
        weekday: cursor.toLocaleDateString("en-GB", { weekday: "short" }),
        date: cursor.getDate(),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return options;
}

export function MentorRequestSheet({
  open,
  onClose,
  mentor,
}: {
  open: boolean;
  onClose: () => void;
  mentor: { id: string; name: string; topics: string[] };
}) {
  const router = useRouter();
  const dayOptions = useMemo(() => upcomingWeekdays(3), []);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOption | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const firstName = mentor.name.split(" ")[0];
  const canSend = selectedTopics.length > 0 && note.trim().length > 0 && selectedDay !== null && timeOfDay !== null;
  const slotLabel = selectedDay && timeOfDay ? `${selectedDay.weekday} ${selectedDay.date}, ${timeOfDay}` : "";

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const send = async () => {
    if (!canSend) return;
    setPhase("processing");
    setSendError(null);
    try {
      await requestMentor(mentor.id, { topics: selectedTopics, note: note.trim(), slot: slotLabel });
      setPhase("done");
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Something went wrong sending your request. Try again.");
      setPhase("idle");
    }
  };

  const reset = () => {
    setSelectedTopics([]);
    setNote("");
    setSelectedDay(null);
    setTimeOfDay(null);
    setPhase("idle");
    setSendError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const browseOthers = () => {
    reset();
    onClose();
    router.push("/services/mentors");
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={phase === "idle" ? "Request a session" : undefined}
      caption={phase === "idle" ? `${firstName} sees this before they accept. Be specific and they can prepare.` : undefined}
    >
      {phase === "idle" ? (
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-[9px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What do you want to cover?</span>
            <div className="flex flex-wrap gap-[8px]">
              {mentor.topics.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    aria-pressed={active}
                    className={`inline-flex h-[34px] items-center gap-[6px] rounded-full border px-[12px] text-[12.5px] transition-colors ${
                      active
                        ? "border-[var(--border-selected)] bg-[var(--selected-tint)] font-semibold text-[var(--text-primary)]"
                        : "border-[var(--border-hairline)] bg-[var(--surface-tag)] font-medium text-[var(--text-secondary)]"
                    }`}
                  >
                    {active ? <Icon name="Check" size={12} color="var(--accent)" strokeWidth={2.6} /> : null}
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Where you are stuck</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell them what you've tried and where it's breaking down."
              rows={4}
              className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[15px] py-[13px] text-[14.5px] leading-[1.5] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          <div className="flex flex-col gap-[9px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Which day suits you?</span>
            <div className="flex gap-[8px]">
              {dayOptions.map((d) => {
                const active = selectedDay?.iso === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    aria-pressed={active}
                    className={`flex flex-1 flex-col items-center gap-[3px] rounded-[var(--radius-input)] border py-[11px] ${
                      active
                        ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <span className="text-[11.5px] font-semibold">{d.weekday}</span>
                    <span className="text-[16px] font-bold [font-feature-settings:var(--font-feature-tabular)]">
                      {d.date}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-[8px]">
              {(["morning", "evening"] as const).map((t) => {
                const active = timeOfDay === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeOfDay(t)}
                    aria-pressed={active}
                    className={`flex-1 rounded-[var(--radius-input)] border py-[9px] text-[13px] font-semibold capitalize ${
                      active
                        ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {sendError ? (
            <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,90,90,0.32)] bg-[var(--danger-tint)] p-[12px_14px]">
              <Icon name="TriangleAlert" size={16} color="var(--danger)" />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">{sendError}</span>
            </div>
          ) : null}

          <Button full disabled={!canSend} onClick={send}>
            Send the request
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-[14px] p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Sending your request…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[16px] p-[8px_0_4px] text-center">
          <span className="grid h-[64px] w-[64px] place-items-center rounded-full border border-[rgba(255,183,3,0.3)] bg-[var(--warning-tint)]">
            <Icon name="Clock" size={28} color="var(--warning)" strokeWidth={2.2} />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[19px] font-bold text-[var(--text-primary)]">Request sent</span>
            <span className="mx-auto max-w-[290px] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {firstName} usually replies within a couple of days. You&apos;ll get a notification either way.
            </span>
          </div>

          <div className="flex w-full flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] text-left">
            <div className="flex items-center gap-[12px]">
              <Avatar initial={mentor.name.charAt(0)} size={38} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{mentor.name}</span>
                <span className="truncate text-[12.5px] text-[var(--text-muted)]">{selectedTopics.join(", ")}</span>
              </div>
            </div>
            <div className="flex items-center gap-[10px] border-t border-[var(--border-hairline)] pt-[11px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">You asked for</span>
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                {slotLabel}
              </span>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Length</span>
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">45 minutes, on a call</span>
            </div>
          </div>

          <span className="mx-auto max-w-[290px] text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            If that time doesn&apos;t work, {firstName} can suggest another.
          </span>

          <div className="mt-[6px] flex w-full gap-[10px]">
            <Button full onClick={close}>
              Done
            </Button>
            <Button full variant="ghost" onClick={browseOthers}>
              Browse other mentors
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
