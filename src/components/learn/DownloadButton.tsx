"use client";

import { useState } from "react";
import { DownloadSheet } from "./DownloadSheet";
import { Button } from "@/components/ui/Button";

/** `className` reaches the button itself, for callers that need it to size to
 *  its own content instead of filling a row. */
export function DownloadButton({
  title,
  fileUrl,
  className = "",
}: {
  title: string;
  fileUrl?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button full size="lg" icon="Download" className={className} onClick={() => setOpen(true)}>
        Download · PDF
      </Button>
      <DownloadSheet open={open} onClose={() => setOpen(false)} title={title} fileUrl={fileUrl} />
    </>
  );
}