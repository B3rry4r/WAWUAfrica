"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
/**
 * Suggested optimal posting days. A static engagement heuristic baked into the
 * widget: no AI service, no API key, no network call. The whole scheduler is
 * local component state and works fully offline.
 */
const SUGGESTED = new Set([6, 12, 17, 25]);

/**
 * The Smart Scheduler demo from the moodboard's WOW Vault panel: a live,
 * clickable February 2026 calendar. February 2026 starts on a Sunday and has
 * exactly 28 days, so the grid is a perfect 4x7 with no lead-in cells.
 */
export function SmartScheduler() {
  const [scheduled, setScheduled] = useState<Set<number>>(new Set([3, 10, 14, 21]));

  const toggle = (day: number) => {
    setScheduled((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-media border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.07)] p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-text-primary">February 2026</span>
          <span className="inline-flex h-[24px] items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.14)] px-2.5 text-[10.5px] font-bold text-text-primary">
            <Icon name="Sparkles" size={11} color="var(--text-primary)" />
            Auto-Optimized
          </span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <span key={d} className="grid h-7 place-items-center text-[10.5px] font-semibold text-text-secondary">
              {d}
            </span>
          ))}
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
            const isOn = scheduled.has(day);
            const isSuggested = !isOn && SUGGESTED.has(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggle(day)}
                aria-pressed={isOn}
                aria-label={`${isOn ? "Unschedule" : "Schedule"} February ${day}`}
                className={`relative grid h-8 place-items-center rounded-[9px] text-[11.5px] font-medium transition-colors duration-150 ${
                  isOn
                    ? "bg-accent font-bold text-on-accent"
                    : isSuggested
                      ? "border border-selected bg-selected-tint text-text-primary"
                      : "text-text-secondary hover:bg-state-hover"
                }`}
              >
                {day}
                {isOn ? <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-on-accent" /> : null}
                {isSuggested ? <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-accent" /> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-[rgba(255,255,255,0.10)] pt-3">
          <span className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-accent" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
            <span className="h-2 w-2 rounded-full border border-accent bg-accent-tint" /> Suggested
          </span>
          <span className="ml-auto text-[10.5px] font-semibold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
            {scheduled.size} scheduled
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold text-text-primary">
          <Icon name="CalendarDays" size={17} color="var(--text-primary)" strokeWidth={2.1} />
          Smart Scheduler
        </span>
        <p className="m-0 text-[13px] leading-normal text-[rgba(255,255,255,0.72)]">
          Plan your content calendar weeks ahead. Auto-post at optimal times for maximum engagement.
        </p>
      </div>
    </div>
  );
}
