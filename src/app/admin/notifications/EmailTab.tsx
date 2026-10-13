"use client";

import { useState } from "react";
import { USE_MOCKS } from "@/lib/api/config";
import { EmailResults } from "./EmailResults";
import { EmailSend } from "./EmailSend";
import { EmailTemplates } from "./EmailTemplates";

type Section = "templates" | "send" | "results";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "templates", label: "Templates" },
  { key: "send", label: "Send" },
  { key: "results", label: "Results" },
];

/**
 * The email campaign tool (EMAIL-01): write a template with a live preview,
 * pick who gets it, test, send, and watch the results. Everything is the
 * live Hub; sending is superadmin only on the server.
 */
export function EmailTab() {
  const [section, setSection] = useState<Section>("templates");
  const [focus, setFocus] = useState<string | null>(null);

  if (USE_MOCKS) {
    return (
      <p className="m-0 rounded-card border border-hairline bg-card p-4 text-[14px] text-text-secondary">
        The email tool needs the live Hub. This build has no Hub address set, so there is nothing to load.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 border-b border-hairline" role="tablist" aria-label="Email sections">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={section === s.key}
            onClick={() => setSection(s.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              section === s.key ? "border-accent text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "templates" ? <EmailTemplates /> : null}
      {section === "send" ? (
        <EmailSend
          onStarted={(id) => {
            setFocus(id);
            setSection("results");
          }}
        />
      ) : null}
      {section === "results" ? <EmailResults focusId={focus} /> : null}
    </div>
  );
}
