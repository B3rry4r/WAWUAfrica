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
        caption="We couldn't load your profile details."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Edit profile
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Skeleton height={120} style={{ borderRadius: "var(--radius-card)" }} />
          <Skeleton height={48} style={{ borderRadius: "var(--radius-input)" }} />
          <Skeleton height={48} style={{ borderRadius: "var(--radius-input)" }} />
          <Skeleton height={110} style={{ borderRadius: "var(--radius-input)" }} />
          <Skeleton height={48} style={{ borderRadius: "var(--radius-input)" }} />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <Avatar initial={draft.name.charAt(0) || "A"} size={84} accent />
              <button
                type="button"
                aria-label="Change photo"
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  display: "grid",
                  placeItems: "center",
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "var(--surface-card)",
                  border: "2px solid var(--surface-page)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
                  cursor: "pointer",
                }}
              >
                <Icon name="Camera" size={14} color="var(--text-secondary)" stroke={2} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Full name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
            <Input
              label="Handle"
              value={draft.handle}
              onChange={(v) => setDraft((d) => ({ ...d, handle: v }))}
              icon="AtSign"
              hint="This is your profile link on WAWU"
            />
            <Input
              label="Bio"
              multiline
              value={draft.bio}
              onChange={(v) => setDraft((d) => ({ ...d, bio: v }))}
              placeholder="Tell buyers and fans about yourself"
            />

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Interests</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DEFAULT_INTERESTS.map((tag) => {
                  const active = draft.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 32,
                        padding: "0 13px",
                        borderRadius: 999,
                        border: `1px solid ${active ? "var(--border-accent)" : "var(--border-hairline)"}`,
                        background: active ? "var(--accent-tint)" : "var(--surface-tag)",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 12.5,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                      {active && <Icon name="X" size={12} color="var(--accent)" stroke={2.4} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Socials</span>
              <Input
                label="Instagram"
                value={draft.socials.instagram ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, socials: { ...d.socials, instagram: v } }))}
                icon="instagram"
                placeholder="username"
              />
              <Input
                label="WhatsApp"
                value={draft.socials.whatsapp ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, socials: { ...d.socials, whatsapp: v } }))}
                icon="whatsapp"
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