"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Phase = "idle" | "processing" | "done";

/**
 * `fileUrl` is the real downloadable asset. Neither the Playbook nor the
 * LearnGuide model carries one yet, so it is usually absent — in that case
 * this says so plainly. It used to run a 700ms timer and then claim
 * "Download started" while delivering no file at all.
 */
export function DownloadSheet({
  open,
  onClose,
  title,
  fileUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fileUrl?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  const download = async () => {
    if (!fileUrl) return;
    setPhase("processing");
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = title;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setPhase("done");
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} caption="Free download, it stays on your device.">
      {phase === "idle" ? (
        <div className="flex flex-col gap-4 p-[6px_0_2px]">
          <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
            {fileUrl
              ? "Downloading is free and keeps your copy on your phone even offline."
              : "This one has no file attached yet. You can still read it in the app, and we'll add the download as soon as it's published."}
          </p>
          <Button full onClick={download} disabled={!fileUrl}>
            {fileUrl ? "Download now" : "Not available yet"}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-3.5 p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" strokeWidth={2} className="animate-[wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Downloading…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-[999px] border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
            <Icon name="Check" size={26} color="var(--success)" strokeWidth={2.6} />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Download started</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              You’ll find it in your downloads when it’s ready.
            </span>
          </div>
          <Button full onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Sheet>
  );
}
