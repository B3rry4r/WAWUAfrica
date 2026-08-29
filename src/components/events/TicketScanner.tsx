"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { scanTicket } from "@/lib/api/event-tickets";
import { describeError } from "@/lib/api/errors";
import type { ScanResult } from "@/types/event-tickets";
import { Button, Callout, Icon, Input } from "@/components/ui";

/**
 * The door.
 *
 * ── TYPING THE CODE IS A FIRST-CLASS PATH, NOT A FALLBACK ──────────────────
 * The camera is a convenience; the keypad is the guarantee. A door has bad
 * light, cracked screens, dying batteries and a queue, and a scanner that can
 * only scan is a scanner that stops working at the worst moment. So the text
 * field is always on screen and focused, and the camera is offered above it.
 * The server's code alphabet drops confusable characters (no I/L/O/U) for
 * exactly this — someone reads it out, someone types it in.
 *
 * ── WHY NO QR-DECODING LIBRARY ─────────────────────────────────────────────
 * Where the browser has `BarcodeDetector` — Chrome on Android, which is what
 * a phone at a Nigerian door is running — we use it. Where it does not, we do
 * not ship a megabyte of WASM to a device that is about to be handed to a
 * volunteer: we say the camera is unavailable and let them type. Shipping a
 * decoder that half-works in bad light would be worse than a keypad that
 * always works.
 *
 * ── ALREADY USED IS AN ANSWER, NOT AN ERROR ────────────────────────────────
 * Three outcomes, three colours, no ambiguity. `already_used` comes back 200
 * and is rendered as a state — the same person queueing twice is ordinary,
 * and the door needs to see WHEN it was first scanned, not a red failure.
 *
 * The scan itself is a conditional write server-side, so two staff scanning
 * one code at the same instant produce exactly one CHECKED IN.
 */

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

export function TicketScanner({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScanned = useRef<string>("");

  const submit = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim().toUpperCase();
      if (!trimmed || busy) return;
      setBusy(true);
      setFailure(null);
      try {
        const outcome = await scanTicket(eventId, trimmed);
        setResult(outcome);
        setCode("");
      } catch (e) {
        setFailure(describeError(e).body);
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, eventId],
  );

  /* ---- camera, where the browser can decode without help ---- */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setCameraError(null);
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike })
      .BarcodeDetector;
    if (!Detector) {
      setCameraError("This browser cannot read a QR code on its own. Type the code underneath instead.");
      return;
    }
    try {
      // `environment` is the rear camera — the one pointed at the ticket.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          const value = found[0]?.rawValue?.trim().toUpperCase();
          // The camera sees the same code many times a second. Only act on a
          // change, or one ticket becomes a hundred identical scans.
          if (value && value !== lastScanned.current) {
            lastScanned.current = value;
            await submit(value);
          }
        } catch {
          // A frame that will not decode is the normal case between reads.
        }
        if (streamRef.current) requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setCameraError("We could not open the camera. Type the code underneath instead.");
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[4px]">
        <Link
          href={`/events/${eventId}/manage`}
          className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
        >
          <Icon name="ArrowLeft" size={17} color="currentColor" />
          {eventName}
        </Link>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
          Check people in
        </h1>
      </div>

      <ScanOutcomeCard result={result} failure={failure} />

      <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
        {cameraOn ? (
          <div className="flex flex-col gap-[10px]">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-square w-full rounded-[var(--radius-input)] bg-[var(--surface-page)] object-cover"
            />
            <Button variant="secondary" onClick={stopCamera} icon="X">
              Stop the camera
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => void startCamera()} icon="Camera">
            Scan with the camera
          </Button>
        )}

        {cameraError ? (
          <Callout tone="warning" full>
            {cameraError}
          </Callout>
        ) : null}

        {/*
          Always present, always focusable. This is the path that works when
          nothing else does.
        */}
        <form
          className="flex flex-col gap-[10px]"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(code);
          }}
        >
          <label className="text-[13px] font-semibold text-[var(--text-secondary)]" htmlFor="ticket-code">
            Or type the code
          </label>
          <Input
            id="ticket-code"
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono tracking-[0.08em]"
          />
          <Button type="submit" full loading={busy} disabled={busy || !code.trim()}>
            Check in
          </Button>
        </form>
      </div>
    </div>
  );
}

function ScanOutcomeCard({ result, failure }: { result: ScanResult | null; failure: string | null }) {
  if (failure) {
    return (
      <Callout tone="danger" title="The scan did not reach the server" full>
        {failure} Nobody has been checked in — try the code again.
      </Callout>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-[8px] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] p-[26px] text-center">
        <Icon name="ScanLine" size={26} color="var(--text-muted)" />
        <p className="m-0 text-[13.5px] text-[var(--text-secondary)]">
          Scan a ticket or type its code. The result appears here.
        </p>
      </div>
    );
  }

  const { outcome, ticket, totals } = result;
  const tone =
    outcome === "valid"
      ? { border: "border-[var(--success)]", bg: "bg-[var(--success-tint)]", text: "text-[var(--success)]", icon: "CircleCheck" as const }
      : outcome === "already_used"
        ? { border: "border-[var(--warning)]", bg: "bg-[var(--warning-tint)]", text: "text-[var(--warning)]", icon: "TriangleAlert" as const }
        : { border: "border-[var(--danger)]", bg: "bg-[var(--danger-tint)]", text: "text-[var(--danger)]", icon: "CircleX" as const };

  return (
    <div className={`flex flex-col gap-[12px] rounded-[var(--radius-card)] border-2 p-[18px] ${tone.border} ${tone.bg}`}>
      <div className="flex items-center gap-[10px]">
        <Icon name={tone.icon} size={30} color="currentColor" className={tone.text} />
        <span className={`text-[22px] font-bold tracking-[-0.01em] ${tone.text}`}>
          {outcome === "valid" ? "LET THEM IN" : outcome === "already_used" ? "ALREADY USED" : "NOT A VALID TICKET"}
        </span>
      </div>

      {ticket ? (
        <div className="flex flex-col gap-[3px]">
          <span className="font-mono text-[13px] tracking-[0.06em] text-[var(--text-primary)]">{ticket.code}</span>
          <span className="text-[13px] text-[var(--text-secondary)]">{ticket.tierName}</span>
          {outcome === "already_used" && ticket.checkedInAt ? (
            <span className="text-[12.5px] text-[var(--text-secondary)]">
              First scanned at{" "}
              {new Date(ticket.checkedInAt).toLocaleString("en-NG", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="m-0 text-[13px] text-[var(--text-secondary)]">
          No ticket on this event carries that code. Check it was read correctly before turning anybody away.
        </p>
      )}

      {totals ? (
        <div className="flex flex-wrap gap-[16px] border-t border-[var(--border-hairline)] pt-[12px]">
          <Total label="In the room" value={totals.checkedIn} />
          <Total label="Sold" value={totals.sold} />
          <Total label="Still to arrive" value={Math.max(0, totals.sold - totals.checkedIn)} />
        </div>
      ) : null}
    </div>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-[19px] font-bold tabular-nums text-[var(--text-primary)]">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
