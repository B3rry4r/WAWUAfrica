"use client";

import { useState } from "react";
import { DownloadSheet } from "./DownloadSheet";
import { Button } from "@/components/ui/Button";

export function DownloadButton({ title, fileUrl }: { title: string; fileUrl?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button full size="lg" icon="Download" onClick={() => setOpen(true)}>
        Download · PDF
      </Button>
      <DownloadSheet open={open} onClose={() => setOpen(false)} title={title} fileUrl={fileUrl} />
    </>
  );
}