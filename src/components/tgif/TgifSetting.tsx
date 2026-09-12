"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isHidden, setHidden, subscribe } from "@/lib/tgif-preference";

/**
 * The Settings row for the TGIF preference, same shape as SoundSetting
 * (layout/SoundToggle.tsx): a row with a switch, not a page of its own,
 * because flipping it is the whole feature.
 *
 * This used to be a bare eye icon sitting in the Home tab row — reachable,
 * but nowhere a user would look for an account preference, and the first
 * thing reported about it. Settings is where the other preferences already
 * are (Sound included), so this joins them there instead.
 */
export function TgifSetting() {
  const [hidden, setHiddenState] = useState(false);

  useEffect(() => {
    setHiddenState(isHidden());
    return subscribe(() => setHiddenState(isHidden()));
  }, []);

  const flip = useCallback(() => setHidden(!isHidden()), []);

  return (
    <button
      type="button"
      onClick={flip}
      role="switch"
      aria-checked={!hidden}
      className="flex w-full items-center gap-[13px] rounded-[var(--radius-input)] p-[11px_10px] text-left transition-colors hover:bg-[var(--state-hover)] active:bg-[var(--state-press)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline bg-input text-text-secondary">
        <Icon name={hidden ? "EyeOff" : "Eye"} size={17} color={hidden ? "currentColor" : "var(--accent)"} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
        <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">TGIF on Home</span>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {hidden ? "Hidden. Tap to bring it back." : "Today's reading leads your Home tabs."}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors ${
          hidden ? "bg-tag" : "bg-accent"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${
            hidden ? "left-[3px]" : "left-[21px]"
          }`}
        />
      </span>
    </button>
  );
}
