"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnProfile, OwnProfileDraft } from "@/types/verification";
import { getOwnProfile, saveProfile } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

const DEFAULT_INTERESTS = ["Agriculture", "Business", "Trade", "Tech", "Crafts", "Beauty", "Music", "Education"];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<OwnProfileDraft>({
    name: "",
    handle: "",
    bio: "",
    interests: [],
    socials: { instagram: "", whatsapp: "" },
  });

  useEffect(() => {
    let active = true;
    getOwnProfile()
      .then((p: OwnProfile) => {
        if (!active) return;
        setDraft({ name: p.name, handle: p.handle, bio: p.bio, interests: [...p.interests], socials: { ...p.socials } });
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
    if (!draft.name.trim() || !draft.handle.trim()) return;
    setSaving(true);
    try {
      await saveProfile({
        ...draft,
        handle: draft.handle.trim().replace(/^@/, ""),
      });
      router.push("/profile");
    } finally {
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
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
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
            <div className="relative">
              <Avatar initial={draft.name.charAt(0) || "A"} size={84} />
              <button
                type="button"
                aria-label="Change photo"
                className="absolute -bottom-0.5 -right-0.5 grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-2 border-page bg-card shadow-[0_2px_10px_rgba(0,0,0,0.28)]"
              >
                <Icon name="Camera" size={14} color="var(--text-secondary)" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[14px]">
            <Input label="Full name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
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
              <div className="flex flex-wrap gap-2">
                {DEFAULT_INTERESTS.map((tag) => {
                  const active = draft.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={[
                        "inline-flex h-8 cursor-pointer items-center gap-[6px] rounded-full border px-[13px] text-[12.5px]",
                        active
                          ? "border-[var(--border-accent)] bg-[var(--accent-tint)] font-semibold text-accent"
                          : "border-hairline bg-tag font-medium text-text-secondary",
                      ].join(" ")}
                    >
                      {tag}
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
              <Input
                label="WhatsApp"
                value={draft.socials.whatsapp ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, socials: { ...d.socials, whatsapp: e.target.value } }))}
                icon={"whatsapp" as IconName}
                inputMode="tel"
                placeholder="0801 234 5678"
              />
            </section>
          </div>

          <Button full disabled={saving || !draft.name.trim() || !draft.handle.trim()} onClick={submit}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      )}
    </div>
  );
}
