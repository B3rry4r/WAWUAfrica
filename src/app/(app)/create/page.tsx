"use client";

import { CreateGate } from "@/components/create/CreateGate";
import { CreateHub } from "@/components/create/CreateHub";

/**
 * `/create` - the creator's Create tab root.
 *
 * It renders the HUB of creatable things now, not the content format picker.
 * The picker moved to /create/content. See CreateHub's doc comment for why.
 */
export default function CreatePage() {
  return (
    <CreateGate>
      {({ slotsUsed, slotsTotal, verification }) => (
        <CreateHub slotsUsed={slotsUsed} slotsTotal={slotsTotal} verification={verification} />
      )}
    </CreateGate>
  );
}
