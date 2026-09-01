"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { pendingCharge, type PendingCharge } from "@/lib/flutterwave";
import { Button, Icon } from "@/components/ui";

/**
 * Where Flutterwave sends a payer back after a hosted checkout.
 *
 * ── WHY THE VERIFY HAPPENS HERE ────────────────────────────────────────────
 * A redirect destroys the page that started the charge, so the promise the
 * caller was awaiting is gone. The intent was parked in sessionStorage before
 * leaving; this page picks it up and finishes the job.
 *
 * The `status` Flutterwave puts in the URL is NOT trusted to mean paid. It is
 * a query parameter on a redirect, i.e. anything can write it. It is only used
 * to tell "they came back having paid" from "they backed out", and the money
 * is confirmed by calling the owning resource's own verify endpoint, which
 * re-checks the transaction with Flutterwave server-side.
 *
 * ── THE STATE THAT MATTERS ─────────────────────────────────────────────────
 * `unconfirmed` is the one worth having. Past the point Flutterwave hands back
 * a transaction id, the payer HAS paid, so this must never offer to charge
 * again. It offers a retry of the VERIFY, which the server makes idempotent.
 */
type Phase = "verifying" | "cancelled" | "unconfirmed" | "lost";

function ReturnBody() {
  const params = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [detail, setDetail] = useState<string | null>(null);
  const parked = useRef<PendingCharge | null>(null);
  // Read once: `take()` clears the record, and React can run an effect twice
  // in development.
  if (parked.current === null) parked.current = pendingCharge.take();

  const status = (params.get("status") ?? "").toLowerCase();
  const txRef = params.get("tx_ref") ?? parked.current?.txRef ?? "";
  const transactionId = params.get("transaction_id") ?? "";

  const verify = useCallback(async () => {
    const record = parked.current;
    if (!record) {
      setPhase("lost");
      return;
    }
    setPhase("verifying");
    try {
      const idFields =
        record.verifyShape === "camel_id_only"
          ? { transactionId }
          : { transaction_id: transactionId, tx_ref: txRef };
      await apiFetch(record.verifyPath, {
        method: "POST",
        authed: true,
        body: { ...(record.verifyBody ?? {}), ...idFields },
      });
      router.replace(record.successPath);
    } catch (e) {
      setDetail(describeError(e).body);
      setPhase("unconfirmed");
    }
  }, [router, transactionId, txRef]);

  useEffect(() => {
    const record = parked.current;
    if (!record) {
      setPhase("lost");
      return;
    }
    // Backing out of a checkout charges nothing, so this is not an error and
    // must not read like one.
    if (!transactionId || (status && status !== "successful" && status !== "completed")) {
      setPhase("cancelled");
      return;
    }
    void verify();
  }, [status, transactionId, verify]);

  if (phase === "verifying") {
    return (
      <Shell
        icon="Loader2"
        spin
        title="Confirming your payment"
        body={parked.current?.label ? `${parked.current.label}. Do not close this page.` : "Do not close this page."}
      />
    );
  }

  if (phase === "cancelled") {
    return (
      <Shell
        icon="Undo2"
        title="Nothing was charged"
        body="You closed the payment before it went through. You can pick up where you left off."
        action={{ label: "Go back", onClick: () => router.replace(parked.current?.cancelPath ?? "/home") }}
      />
    );
  }

  if (phase === "unconfirmed") {
    return (
      <Shell
        icon="TriangleAlert"
        tone="warning"
        title="Your payment went through. We are still confirming it"
        body={
          detail
            ? `${detail} This is safe to check again; it will not charge you twice.`
            : "This is safe to check again; it will not charge you twice."
        }
        action={{ label: "Check again", onClick: () => void verify() }}
      />
    );
  }

  return (
    <Shell
      icon="TriangleAlert"
      tone="warning"
      title="We lost track of that payment"
      body="If money left your account it is safe. Open the screen you were paying from and it will show the current state."
      action={{ label: "Go home", onClick: () => router.replace("/home") }}
    />
  );
}

function Shell({
  icon,
  title,
  body,
  action,
  tone,
  spin,
}: {
  icon: "Loader2" | "Undo2" | "TriangleAlert";
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  tone?: "warning";
  spin?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-[24px]">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[26px] text-center">
        <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--surface-tag)]">
          <Icon
            name={icon}
            size={20}
            color={tone === "warning" ? "var(--warning)" : "var(--accent)"}
            className={spin ? "[animation:wawuSpin_900ms_linear_infinite]" : undefined}
          />
        </span>
        <h1 className="m-0 text-[18px] font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{body}</p>
        {action ? (
          <Button onClick={action.onClick} full>
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnBody />
    </Suspense>
  );
}
