"use client";

import { useEffect, useState } from "react";
import {
  getHealthPlans,
  initHealthSubscription,
  verifyHealthSubscription,
  getMyHealthSubscriptions,
  type HealthPlan,
  type HealthSubscription,
} from "@/lib/api/lifestyle";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { useSession } from "@/lib/auth/session-provider";
import { getService } from "@/lib/api/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { BackLink, Button, ErrorState, Icon, Input, PhoneInput, Skeleton, fullPhoneNumber, DEFAULT_DIAL_CODE } from "@/components/ui";
import { formatNaira } from "@/lib/format";

/**
 * Telemedicine — health cover and virtual consultations, fulfilled by WellaHealth.
 *
 * The enrolment details are the partner's requirements, not ours: they key
 * the enrollee on phone number and need a date of birth and gender to issue
 * a policy. Collecting them up front is what stops a paid subscription
 * failing at the enrolment step with the money already taken.
 */
export default function CarePage() {
  const { user } = useSession();
  const [plans, setPlans] = useState<HealthPlan[] | null>(null);
  const [mine, setMine] = useState<HealthSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HealthPlan | null>(null);
  /** Which plan has its cover details open. Only one at a time. */
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<HealthSubscription | null>(null);

  /**
   * Whether this service is open yet, from the catalogue.
   *
   * This page lives at a static route, which Next resolves ahead of the
   * dynamic /services/[id] detail page — so the "Notify me" button on the
   * coming-soon card opened the full enrolment flow, payment and all. The page
   * has to refuse on its own, which also covers anyone with the URL.
   */
  const [live, setLive] = useState<boolean | null>(null);
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "Female",
    dateOfBirth: "",
  });

  useEffect(() => {
    getService("care")
      .then((svc) => setLive(svc ? svc.status === "live" : false))
      // A catalogue that will not load is not permission to sell.
      .catch(() => setLive(false));
  }, []);

  useEffect(() => {
    if (live !== true) return;
    getHealthPlans()
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load health plans."));
    getMyHealthSubscriptions()
      .then((rows) => setMine(Array.isArray(rows) ? rows : []))
      .catch(() => setMine([]));
  }, []);

  async function onSubscribe() {
    if (!selected) return;
    const customer = checkoutCustomerFromSession(user);
    if (!customer) {
      setError("We need an email on your account before you can pay.");
      return;
    }
    if (!form.firstName || !form.lastName || !form.phoneNumber || !form.dateOfBirth) {
      setError("Fill in every field so we can register you with the provider.");
      return;
    }

    setBusy(true); setError(null);
    try {
      const { subscriptionId, flutterwaveConfig } = await initHealthSubscription({
        planCode: selected.planCode,
        ...form,
        phoneNumber: fullPhoneNumber(dialCode, form.phoneNumber),
        email: user?.email,
      });
      const result = await openFlutterwaveCheckout(flutterwaveConfig, customer, {
        title: "Telemedicine",
        description: selected.planName,
      });
      const record = await verifyHealthSubscription(subscriptionId, result.transaction_id);
      setDone(record);
      setMine((m) => [record, ...m]);
    } catch (e) {
      if (!isFlutterwaveCancelled(e)) {
        setError(e instanceof Error ? e.message : "That did not complete.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (live === false) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <BackLink />
        <div className="flex flex-col items-start gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-elevated)]">
            <Icon name="Stethoscope" size={22} color="var(--text-secondary)" strokeWidth={2} />
          </span>
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Telemedicine is coming soon</span>
          <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">
            We are finishing the rollout with our care partner. It opens here first, and nothing is charged until it does.
          </p>
        </div>
      </div>
    );
  }

  if (live === null) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px]">
        <Skeleton variant="card" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
        <ProfileBackButton />
        <div className="flex flex-col items-center gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)] p-[26px] text-center">
          <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[var(--accent-tint)]">
            <Icon name="HeartPulse" size={26} color="var(--accent)" strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-bold text-[var(--text-primary)]">You are covered</span>
          <span className="text-[14px] text-[var(--text-secondary)]">{done.planName}</span>
          {done.policyNumber ? (
            <span className="text-[12.5px] text-[var(--text-muted)]">Policy {done.policyNumber}</span>
          ) : null}
          <span className="text-[13px] text-[var(--text-secondary)]">
            Your cover is tied to {done.phoneNumber}. Use that number when you contact a doctor.
          </span>
          <Button className="mt-2" onClick={() => setDone(null)}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <ProfileBackButton />
      <div className="flex flex-col gap-[6px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Telemedicine</span>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">See a doctor</h1>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          Virtual consultations, medication cover and screening. Pay monthly, use it as often as you need.
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {mine.filter((m) => m.status === "delivered").map((m) => (
        <div key={m.id} className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--accent-tint)] p-[14px]">
          <Icon name="ShieldCheck" size={20} color="var(--accent)" />
          <span className="flex flex-col">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">{m.planName} is active</span>
            <span className="text-[12.5px] text-[var(--text-secondary)]">
              On {m.phoneNumber}{m.expiresAt ? ` · renews ${new Date(m.expiresAt).toLocaleDateString("en-NG")}` : ""}
            </span>
          </span>
        </div>
      ))}

      {/*
        Plans and the enrolment form were stacked, so on a wide screen this ran
        for two screens of scrolling in one narrow column. Side by side on
        desktop, stacked on mobile — and only once there are plans to show, so
        an error is not split across two columns with an empty placeholder
        beside it.
      */}
      {!plans ? (
        <Skeleton variant="card" />
      ) : (
      <div className="flex flex-col gap-[18px] xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-[22px]">
        <div className="flex flex-col gap-[14px]">
        <div className="flex flex-col gap-[10px] xl:gap-[12px]">
          {plans.map((p) => {
            const on = selected?.planCode === p.planCode;
            const open = expanded === p.planCode;
            const benefits = p.planBenefits ?? [];
            return (
              <div
                key={p.planCode}
                className={`flex flex-col rounded-[var(--radius-card)] border ${
                  on ? "border-[var(--border-accent)] bg-[var(--surface-elevated)]" : "border-[var(--border-hairline)] bg-[var(--surface-card)]"
                }`}
              >
                {/*
                  Every plan listing its whole benefit list made the page a wall
                  of near-identical text you had to scroll past to compare
                  prices. The title row is the plan; the detail is one tap away.
                */}
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex items-baseline justify-between gap-3 p-[16px] text-left"
                >
                  <span className="text-[15.5px] font-bold text-[var(--text-primary)]">{p.planName}</span>
                  <span className="whitespace-nowrap text-[16px] font-bold text-[var(--text-primary)]">
                    {formatNaira(Math.round(p.price))}
                    <span className="text-[12px] font-normal text-[var(--text-muted)]">
                      {p.numberOfMonths === 1 ? " /month" : p.numberOfMonths ? ` /${p.numberOfMonths} months` : ""}
                    </span>
                  </span>
                </button>

                {benefits.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : p.planCode)}
                      aria-expanded={open}
                      className="flex items-center gap-1.5 px-[16px] pb-[14px] text-[12.5px] font-semibold text-[var(--accent)]"
                    >
                      {open ? "Hide what is covered" : "What is covered"}
                      <Icon
                        name="ChevronDown"
                        size={14}
                        color="var(--accent)"
                        strokeWidth={2.4}
                        className={open ? "rotate-180 transition-transform" : "transition-transform"}
                      />
                    </button>
                    {open ? (
                      <div className="flex flex-col gap-[7px] border-t border-[var(--border-hairline)] p-[14px_16px]">
                        {benefits.map((b) => (
                          <span key={b} className="flex items-start gap-2 text-[13px] leading-[1.45] text-[var(--text-secondary)]">
                            <Icon name="Check" size={14} color="var(--accent)" strokeWidth={2.4} className="mt-[2px] shrink-0" />
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
        </div>

        {selected ? (
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:sticky xl:top-[22px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Who is this cover for?</span>
          <Input label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <PhoneInput
            dialCode={dialCode}
            value={form.phoneNumber}
            onDialCodeChange={setDialCode}
            onValueChange={(v) => setForm({ ...form, phoneNumber: v })}
            hint="Your cover is issued against this number."
          />
          <Input
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <div className="flex gap-2">
            {["Female", "Male"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm({ ...form, gender: g })}
                className={`flex-1 rounded-[var(--radius-chip)] border px-[14px] py-2 text-[13px] ${
                  form.gender === g
                    ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <Button full onClick={onSubscribe} disabled={busy}>
            {busy ? "Opening checkout…" : `Pay ${formatNaira(Math.round(selected.price))}`}
          </Button>
          <span className="text-[12px] leading-[1.5] text-[var(--text-muted)]">
            Cover is registered against the phone number above with our care partner.
          </span>
        </div>
        ) : (
          <div className="hidden rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] p-[18px] text-[13px] leading-[1.5] text-[var(--text-muted)] xl:block">
            Pick a plan to see what it covers and who it is for.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
