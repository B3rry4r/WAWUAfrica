"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Icon, Input } from "@/components/ui";
import { createReferralCode, joinLinkFor, updateReferralCode } from "@/lib/api/referrals";
import type { ReferralCodeChange, ReferralCodeRow } from "@/lib/api/referrals";
import { getCurrentOffer } from "@/lib/api/waitlist";
import { describeError } from "@/lib/api/errors";
import { formatNairaFromKobo } from "@/lib/format";

const n = (v: number) => v.toLocaleString("en-NG");

/** "1,200" or "1200.50" in naira, as whole kobo; null when it is not an amount. */
export function nairaToKobo(text: string): number | null {
  const t = text.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(parseFloat(t) * 100);
}

/** A limit as typed: empty means no limit; otherwise a whole number of 1 or more. `undefined` when it is not one. */
function limitOf(text: string): number | null | undefined {
  const t = text.trim();
  if (t === "") return null;
  return /^\d+$/.test(t) && Number(t) >= 1 ? Number(t) : undefined;
}

const BUTTON =
  "inline-flex h-[40px] items-center justify-center gap-1.5 rounded-button border border-hairline bg-card px-3.5 text-[13.5px] font-semibold text-text-primary transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:text-text-disabled";
const PRIMARY =
  "inline-flex h-[44px] items-center justify-center gap-2 rounded-button bg-accent px-5 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-tag disabled:text-text-disabled";

type Pick = "none" | "half" | "standard" | "custom";

/** The on/off switch of a code. */
function Switch({ on, busy, label, onToggle }: { on: boolean; busy: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      className={`relative inline-flex h-[28px] w-[50px] flex-none items-center rounded-full border transition-colors disabled:opacity-60 ${
        on ? "border-accent bg-accent" : "border-hairline bg-tag"
      }`}
    >
      <span
        className={`inline-block h-[22px] w-[22px] rounded-full bg-white shadow-card transition-transform ${
          on ? "translate-x-[24px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/** The state of a code as text, for a role that cannot switch it. */
function StateText({ on }: { on: boolean }) {
  return <span className={`inline-block w-[50px] text-[14px] font-semibold ${on ? "text-success" : "text-text-muted"}`}>{on ? "On" : "Off"}</span>;
}

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const link = joinLinkFor(code);
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("no clipboard");
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link", link);
    }
  }
  return (
    <button type="button" onClick={() => void copy()} className={BUTTON} aria-label={`Copy link for ${code}`}>
      <Icon name={copied ? "Check" : "Copy"} size={15} />
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function EditRow({ row, onDone }: { row: ReferralCodeRow; onDone: (changed: boolean) => void }) {
  const [community, setCommunity] = useState(row.community);
  const [price, setPrice] = useState(String(row.priceKobo / 100));
  const [limit, setLimit] = useState(row.limit === null ? "" : String(row.limit));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    const kobo = nairaToKobo(price);
    const lim = limitOf(limit);
    if (kobo === null) return setError("Enter the price as an amount in naira, for example 1200.");
    if (lim === undefined) return setError("The limit is a whole number of 1 or more, or empty for no limit.");
    const change: ReferralCodeChange = {};
    if (community.trim() !== row.community) change.community = community.trim();
    if (kobo !== row.priceKobo) change.priceKobo = kobo;
    if (lim !== row.limit) change.limit = lim;
    if (Object.keys(change).length === 0) return onDone(false);
    setBusy(true);
    setError(null);
    try {
      await updateReferralCode(row.id, change);
      onDone(true);
    } catch (err) {
      setError(describeError(err).body);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="col-span-2 flex flex-col gap-3 rounded-input border border-hairline bg-elevated p-4 dt:col-span-8">
      <p className="m-0 text-[12.5px] text-text-muted">A change affects only people who register after it.</p>
      <div className="grid gap-3 dt:grid-cols-3">
        <Input label="Community" value={community} onChange={(e) => setCommunity(e.target.value)} maxLength={80} required />
        <Input
          label="Price (₦)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          hint="0 means no payment."
          required
        />
        <Input
          label="Limit"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          inputMode="numeric"
          hint="Empty means no limit."
        />
      </div>
      {error ? (
        <p role="alert" className="m-0 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={PRIMARY}>
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={() => onDone(false)} className={BUTTON}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function CodeRow({ row, canWrite, onChanged }: { row: ReferralCodeRow; canWrite: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await updateReferralCode(row.id, { active: !row.active });
      onChanged();
    } catch (err) {
      setError(describeError(err).body);
    } finally {
      setBusy(false);
    }
  }

  const cell = "flex items-baseline justify-between gap-2 dt:block";
  const label = "text-[12px] text-text-muted dt:hidden";
  return (
    <div
      data-testid={`code-${row.code}`}
      className="grid grid-cols-2 items-center gap-x-3 gap-y-2.5 border-b border-hairline px-4 py-4 last:border-b-0 dt:grid-cols-[1.1fr_1.2fr_.8fr_1fr_.6fr_1fr_auto_auto] dt:py-3.5"
    >
      <div className="col-span-2 flex items-center justify-between gap-3 dt:col-span-1 dt:block">
        <span className="text-[16px] font-extrabold tracking-[0.02em] text-text-primary">{row.code}</span>
        <span className="dt:hidden">
          {canWrite ? (
            <Switch on={row.active} busy={busy} label={`${row.code} is ${row.active ? "on" : "off"}`} onToggle={() => void toggle()} />
          ) : (
            <StateText on={row.active} />
          )}
        </span>
      </div>
      <div className={`${cell} col-span-2 dt:col-span-1`}>
        <span className={label}>Community</span>
        <span className="truncate text-[14px] text-text-secondary">{row.community}</span>
      </div>
      <div className={cell}>
        <span className={label}>Price</span>
        <span className="text-[14px] text-text-primary">{formatNairaFromKobo(row.priceKobo)}</span>
      </div>
      <div className={cell}>
        <span className={label}>Used</span>
        <span className="text-[14px] text-text-primary">
          {n(row.paidCount)} / {row.limit === null ? "no limit" : n(row.limit)}
        </span>
      </div>
      <div className={cell}>
        <span className={label}>Held</span>
        <span className="text-[14px] text-text-primary">{n(row.heldCount)}</span>
      </div>
      <div className={cell}>
        <span className={label}>Money paid</span>
        <span className="text-[14px] text-text-primary">{formatNairaFromKobo(row.paidKobo)}</span>
      </div>
      <div className="hidden dt:block">
        {canWrite ? (
          <Switch on={row.active} busy={busy} label={`${row.code} is ${row.active ? "on" : "off"}`} onToggle={() => void toggle()} />
        ) : (
          <StateText on={row.active} />
        )}
      </div>
      <div className="col-span-2 flex flex-wrap gap-2 dt:col-span-1">
        <CopyLink code={row.code} />
        {canWrite ? (
          <button type="button" onClick={() => setEditing((v) => !v)} className={BUTTON} aria-expanded={editing}>
            <Icon name="Pencil" size={15} />
            Edit
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="col-span-2 m-0 text-[13px] text-danger dt:col-span-8">
          {error}
        </p>
      ) : null}
      {canWrite && editing ? (
        <EditRow
          row={row}
          onDone={(changed) => {
            setEditing(false);
            if (changed) onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

function NewCode({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [community, setCommunity] = useState("");
  const [pick, setPick] = useState<Pick>("none");
  const [custom, setCustom] = useState("");
  const [limit, setLimit] = useState("");
  const [standard, setStandard] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The standard price is the open offer's, read from the server; nothing is typed here.
  useEffect(() => {
    let live = true;
    getCurrentOffer()
      .then((o) => live && setStandard(o.priceKobo))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const priceKobo =
    pick === "none" ? 0 : pick === "half" ? (standard === null ? null : Math.round(standard / 2)) : pick === "standard" ? standard : nairaToKobo(custom);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const lim = limitOf(limit);
    if (priceKobo === null) return setError("Choose a price, or enter an amount in naira.");
    if (lim === undefined) return setError("The limit is a whole number of 1 or more, or empty for no limit.");
    setBusy(true);
    setError(null);
    try {
      await createReferralCode({ code: code.trim(), community: community.trim(), priceKobo, limit: lim });
      setCode("");
      setCommunity("");
      setLimit("");
      setCustom("");
      setPick("none");
      onCreated();
    } catch (err) {
      setError(describeError(err).body);
    } finally {
      setBusy(false);
    }
  }

  const picks: Array<[Pick, string, string]> = [
    ["none", "No charge", "₦0"],
    ["half", "Half the standard price", standard === null ? "" : formatNairaFromKobo(Math.round(standard / 2))],
    ["standard", "Standard price, for tracking only", standard === null ? "" : formatNairaFromKobo(standard)],
    ["custom", "Any amount", ""],
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-4 dt:p-5" data-testid="new-code">
      <h3 className="m-0 text-[15.5px] font-bold text-text-primary">New code</h3>
      <div className="grid gap-3 dt:grid-cols-3">
        <Input
          label="Code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={20}
          hint="3 to 20 letters and numbers."
          required
        />
        <Input
          label="Community"
          name="community"
          value={community}
          onChange={(e) => setCommunity(e.target.value)}
          maxLength={80}
          hint="The name you track it by."
          required
        />
        <Input
          label="Limit"
          name="limit"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          inputMode="numeric"
          hint="How many people. Empty means no limit."
        />
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-semibold text-text-secondary">What the person pays</legend>
        <div className="flex flex-wrap gap-2">
          {picks.map(([value, text, amount]) => (
            <button
              key={value}
              type="button"
              aria-pressed={pick === value}
              disabled={(value === "half" || value === "standard") && standard === null}
              onClick={() => setPick(value)}
              className={`inline-flex min-h-[44px] flex-col items-start justify-center rounded-input border px-3.5 py-1.5 text-left transition-colors disabled:opacity-50 ${
                pick === value ? "border-accent bg-accent-tint" : "border-hairline bg-elevated hover:bg-card"
              }`}
            >
              <span className="text-[13.5px] font-semibold text-text-primary">{text}</span>
              {amount ? <span className="text-[12px] text-text-muted">{amount}</span> : null}
            </button>
          ))}
        </div>
        {pick === "custom" ? (
          <div className="max-w-[260px]">
            <Input
              label="Amount (₦)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              inputMode="decimal"
              hint={standard === null ? undefined : `Up to ${formatNairaFromKobo(standard)}.`}
            />
          </div>
        ) : null}
      </fieldset>
      {error ? (
        <p role="alert" className="m-0 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <div>
        <button type="submit" disabled={busy || code.trim().length < 3 || community.trim() === ""} className={PRIMARY}>
          {busy ? "Creating..." : "Create code"}
        </button>
      </div>
    </form>
  );
}

/**
 * The codes: their numbers, copy link, and, for a role that may change codes
 * (`canWrite`, superadmin), an on/off switch, edit and a form for a new one.
 * Any other role sees the state of each code as text and nothing that the Hub
 * would refuse.
 */
export function CodesPanel({
  codes,
  canWrite,
  onChanged,
}: {
  codes: ReferralCodeRow[] | null;
  canWrite: boolean;
  onChanged: () => void | Promise<void>;
}) {
  return (
    <section aria-labelledby="codes-title" className="flex flex-col gap-4">
      <h2 id="codes-title" className="m-0 text-[17px] font-bold text-text-primary">
        Referral codes
      </h2>
      <div className="flex flex-col rounded-card border border-hairline bg-card" data-testid="codes">
        <div className="hidden grid-cols-[1.1fr_1.2fr_.8fr_1fr_.6fr_1fr_auto_auto] gap-3 border-b border-hairline px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted dt:grid">
          <span>Code</span>
          <span>Community</span>
          <span>Price</span>
          <span>Used / limit</span>
          <span>Held</span>
          <span>Money paid</span>
          <span className="w-[50px]">On</span>
          {/* As wide as the buttons under it: Copy link and Edit, or Copy link alone for a role that cannot edit. */}
          <span className={canWrite ? "w-[200px]" : "w-[108px]"} />
        </div>
        {codes === null ? (
          <p className="m-0 px-4 py-4 text-[13.5px] text-text-muted">Loading...</p>
        ) : codes.length === 0 ? (
          <p className="m-0 px-4 py-4 text-[13.5px] text-text-muted">
            {canWrite ? "No codes yet. Make the first one below." : "No codes yet."}
          </p>
        ) : (
          codes.map((c) => <CodeRow key={c.id} row={c} canWrite={canWrite} onChanged={() => void onChanged()} />)
        )}
      </div>
      {canWrite ? <NewCode onCreated={() => void onChanged()} /> : null}
    </section>
  );
}
