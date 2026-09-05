"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnProfile, OwnProfileDraft } from "@/types/verification";
import { getOwnProfile, saveProfile } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { FilePicker } from "@/components/ui/FilePicker";
import { Input } from "@/components/ui/Input";
import { socialFieldValue } from "@/lib/social-handles";
import { DEFAULT_DIAL_CODE, PhoneInput, fullPhoneNumber, splitPhoneNumber } from "@/components/ui/PhoneInput";
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
    avatarUrl: null,
    coverUrl: null,
  });

  useEffect(() => {
    let active = true;
    getOwnProfile()
      .then((p: OwnProfile) => {
        if (!active) return;
        setDraft({ firstName: p.firstName, middleName: p.middleName, lastName: p.lastName, name: p.name, handle: p.handle, bio: p.bio, interests: [...p.interests], socials: { ...p.socials }, avatarUrl: p.avatarUrl, coverUrl: p.coverUrl });
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
          {/*
            A PROFILE PICTURE, WHICH CREATORS COULD NOT SET AT ALL.

            This was a generated initial with no upload behind it anywhere in
            the product, so every creator on the platform looked the same. The
            cover is new too: cards and the profile header had nothing to show
            but flat colour.

            Both are optional. An account with neither still renders the
            initial and a plain header, exactly as before.
          */}
          <div className="flex flex-col gap-[12px]">
            <div className="relative">
              <div className="h-[112px] w-full overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-[var(--surface-input)]">
                {draft.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="absolute -bottom-[26px] left-1/2 -translate-x-1/2">
                {draft.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.avatarUrl}
                    alt=""
                    className="h-[84px] w-[84px] rounded-full border-[3px] border-[var(--surface-page)] object-cover"
                  />
                ) : (
                  <Avatar initial={draft.firstName.charAt(0) || "A"} size={84} />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-[10px] pt-[30px]">
              <FilePicker
                folder="avatars"
                accept="image/*"
                label={draft.avatarUrl ? "Change your profile picture" : "Add a profile picture"}
                hint="A square photo works best."
                onUploaded={(f) => setDraft((d) => ({ ...d, avatarUrl: f.fileUrl }))}
                onCleared={() => setDraft((d) => ({ ...d, avatarUrl: null }))}
              />
              <FilePicker
                folder="profile/cover"
                accept="image/*"
                label={draft.coverUrl ? "Change your cover photo" : "Add a cover photo"}
                hint="Wide, at least 1200 pixels across."
                onUploaded={(f) => setDraft((d) => ({ ...d, coverUrl: f.fileUrl }))}
                onCleared={() => setDraft((d) => ({ ...d, coverUrl: null }))}
              />
            </div>
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
                prefix={socialFieldValue(draft.socials.instagram, "instagram").prefix}
                value={socialFieldValue(draft.socials.instagram, "instagram").value}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, instagram: e.target.value } }))}
                placeholder="yourname"
              />
              <PhoneInput
                label="WhatsApp"
                dialCode={waDialCode}
                value={splitPhoneNumber(draft.socials.whatsapp ?? "").value}
                onDialCodeChange={setWaDialCode}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, socials: { ...d.socials, whatsapp: v ? fullPhoneNumber(waDialCode, v) : "" } }))
                }
              />
              {/*
                USERNAME WHERE THE PLATFORM HAS ONE, LINK WHERE IT DOES NOT.

                Instagram, X, TikTok and YouTube all give every account a
                single unambiguous @handle, so those fields show the address
                in front of the box and ask only for the name. Nobody should
                have to go and copy their own profile URL.

                Facebook and LinkedIn stay plain links, deliberately. A large
                share of Facebook profiles have no username at all and live at
                profile.php?id=<digits>, and LinkedIn splits people (/in/)
                from organisations (/company/), so a single prefix would be
                wrong for a good number of people. Better an honest link field
                than a prefix that quietly builds a dead address.

                All of them still ACCEPT either: the API expands a bare handle
                and leaves a pasted URL alone, so nothing a creator types is
                rejected for being the wrong shape.
              */}
              <Input
                label="X"
                prefix={socialFieldValue(draft.socials.x, "x").prefix}
                value={socialFieldValue(draft.socials.x, "x").value}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, x: e.target.value } }))}
                placeholder="yourname"
              />
              <Input
                label="TikTok"
                prefix={socialFieldValue(draft.socials.tiktok, "tiktok").prefix}
                value={socialFieldValue(draft.socials.tiktok, "tiktok").value}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, tiktok: e.target.value } }))}
                placeholder="yourname"
              />
              <Input
                label="YouTube"
                prefix={socialFieldValue(draft.socials.youtube, "youtube").prefix}
                value={socialFieldValue(draft.socials.youtube, "youtube").value}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, youtube: e.target.value } }))}
                placeholder="yourname"
              />
              <Input
                label="Facebook"
                value={draft.socials.facebook ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, facebook: e.target.value } }))}
                inputMode="url"
                placeholder="Paste your profile or page link"
                hint="Facebook profiles often have no username, so paste the link."
              />
              <Input
                label="LinkedIn"
                value={draft.socials.linkedin ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, linkedin: e.target.value } }))}
                inputMode="url"
                placeholder="Paste your profile or company link"
              />
              <Input
                label="LinkedIn"
                value={draft.socials.linkedin ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, linkedin: e.target.value } }))}
                placeholder="yourname"
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
