"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnProfile, OwnProfileDraft } from "@/types/verification";
import { getOwnProfile, saveProfile } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { PhoneInput, fullPhoneNumber, DEFAULT_DIAL_CODE } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CATEGORIES } from "@/lib/categories";

/**
 * The chips a person picks here are what Explore filters creators by, so they
 * have to be the SAME taxonomy Explore browses — the platform's 25 categories.
 *
 * They used to be eight hardcoded words ("Agriculture", "Tech", "Crafts") that
 * matched no category id anywhere, which meant a creator could fill this in
 * carefully and still appear under nothing. The value stored is the category
 * id, and the label shown is its real name.
 */
const INTEREST_OPTIONS = CATEGORIES.map((c) => ({ value: c.id, label: c.name }));

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Stored as one string, but edited as dial code + number.
  const [waDialCode, setWaDialCode] = useState(DEFAULT_DIAL_CODE);
  const [draft, setDraft] = useState<OwnProfileDraft>({
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    handle: "",
    bio: "",
    interests: [],
    socials: { instagram: "", whatsapp: "", x: "", tiktok: "", youtube: "", facebook: "", linkedin: "", website: "" },
  });

  useEffect(() => {
    let active = true;
    getOwnProfile()
      .then((p: OwnProfile) => {
        if (!active) return;
        setDraft({ firstName: p.firstName, middleName: p.middleName, lastName: p.lastName, name: p.name, handle: p.handle, bio: p.bio, interests: [...p.interests], socials: { ...p.socials } });
        setLoading(false);
      })
      .catch(() => active && (setLoadError(true), setLoading(false)));
    return () => {
      active = false;
    };
  }, []);

  const toggleInterest = (tag: string) => {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(tag) ? d.interests.filter((t) => t !== tag) : [...d.interests, tag],
    }));
  };

  const submit = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.handle.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        ...draft,
        handle: draft.handle.trim().replace(/^@/, ""),
      });
      router.push("/profile");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "That didn't save. Try again.");
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <ErrorState
        title="We couldn't load your profile details."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    // The cap lives on the OUTER column, not on one branch. It used to sit on
    // the loading skeleton only, so the skeleton was 760px and the real form
    // that replaced it ran the full 994px of the desktop column — inputs and a
    // primary button a thousand pixels wide.
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[760px] xl:pt-[26px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
          Edit profile
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-[18px]">
          <Skeleton className="h-[120px] w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-12 w-full rounded-[var(--radius-input)]" />
          <Skeleton className="h-12 w-full rounded-[var(--radius-input)]" />
          <Skeleton className="h-[110px] w-full rounded-[var(--radius-input)]" />
          <Skeleton className="h-12 w-full rounded-[var(--radius-input)]" />
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <Avatar initial={draft.firstName.charAt(0) || "A"} size={84} />
          </div>

          <div className="flex flex-col gap-[14px]">
            {/*
              Editable, in three parts.

              This was a DISABLED field explaining that names "can't be changed
              here yet" — true at the time, because WAWU ID had no route to
              change one. It has one now. That matters more than tidiness: KYC
              is a manual review against a government ID, so somebody who
              mistyped their surname at sign-up had a permanently held payout
              and no way to fix it without support.
            */}
            <Input
              label="First name"
              value={draft.firstName}
              onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
            />
            <Input
              label="Middle name (optional)"
              value={draft.middleName}
              onChange={(e) => setDraft((d) => ({ ...d, middleName: e.target.value }))}
            />
            <Input
              label="Last name"
              value={draft.lastName}
              onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
              hint="Use the name on your government ID. Verification and payouts are checked against it."
            />
            <Input
              label="Handle"
              value={draft.handle}
              onChange={(e) => setDraft((d) => ({ ...d, handle: e.target.value }))}
              icon="AtSign"
              hint="This is your profile link on WAWU"
            />
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-text-secondary">Bio</span>
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="Tell buyers and fans about yourself"
                rows={4}
                className="min-h-[110px] w-full resize-none rounded-[var(--radius-input)] border border-hairline bg-input px-4 py-3 text-[15px] text-text-primary outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <section className="flex flex-col gap-[10px]">
              <span className="text-[13px] font-semibold text-text-secondary">Interests</span>
              <span className="text-[12px] leading-[1.45] text-text-muted">
                These decide where you show up when someone browses Explore.
              </span>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(({ value, label }) => {
                  const active = draft.interests.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleInterest(value)}
                      className={[
                        "inline-flex h-8 cursor-pointer items-center gap-[6px] rounded-full border px-[13px] text-[12.5px]",
                        active
                          ? "border-[var(--border-selected)] bg-[var(--selected-tint)] font-semibold text-accent"
                          : "border-hairline bg-tag font-medium text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press",
                      ].join(" ")}
                    >
                      {label}
                      {active && <Icon name="X" size={12} color="var(--accent)" strokeWidth={2.4} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-[10px]">
              <span className="text-[13px] font-semibold text-text-secondary">Socials</span>
              <Input
                label="Instagram"
                value={draft.socials.instagram ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, instagram: e.target.value } }))}
                icon={"instagram" as IconName}
                placeholder="username"
              />
              <PhoneInput
                label="WhatsApp"
                dialCode={waDialCode}
                value={(draft.socials.whatsapp ?? "").replace(/^\+\d{1,4}/, "")}
                onDialCodeChange={setWaDialCode}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, socials: { ...d.socials, whatsapp: v ? fullPhoneNumber(waDialCode, v) : "" } }))
                }
              />
              {/*
                Instagram and WhatsApp alone left most of where an audience
                actually is unreachable from a profile. Handles are typed bare;
                the link fields want a full URL because the API validates them
                as one.
              */}
              <Input
                label="X"
                value={draft.socials.x ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, x: e.target.value } }))}
                placeholder="username"
              />
              <Input
                label="TikTok"
                value={draft.socials.tiktok ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, tiktok: e.target.value } }))}
                placeholder="username"
              />
              <Input
                label="YouTube"
                value={draft.socials.youtube ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, youtube: e.target.value } }))}
                inputMode="url"
                placeholder="https://youtube.com/@you"
              />
              <Input
                label="Facebook"
                value={draft.socials.facebook ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, facebook: e.target.value } }))}
                inputMode="url"
                placeholder="https://facebook.com/you"
              />
              <Input
                label="LinkedIn"
                value={draft.socials.linkedin ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, linkedin: e.target.value } }))}
                inputMode="url"
                placeholder="https://linkedin.com/in/you"
              />
              <Input
                label="Website"
                value={draft.socials.website ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, website: e.target.value } }))}
                inputMode="url"
                placeholder="https://yoursite.com"
              />
            </section>
          </div>

          {saveError ? (
            <span className="flex items-center gap-[7px] px-[4px] text-[12px] text-[var(--danger)]">
              <Icon name="CircleAlert" size={14} color="var(--danger)" />
              {saveError}
            </span>
          ) : null}

          <Button
            full
            disabled={saving || !draft.name.trim() || !draft.handle.trim()}
            onClick={submit}
            className="xl:w-auto xl:self-start"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      )}
    </div>
  );
}
