"use client";

import { CreateGate } from "@/components/create/CreateGate";
import { ContentTypePicker } from "@/components/create/ContentTypePicker";

/**
 * `/create/content` - step two of Create: which FORMAT the content is.
 *
 * Behind the same creator gate as the hub, via CreateGate, so somebody who
 * deep-links straight here meets the same guard and the same wording rather
 * than a second opinion about who may publish.
 */
export default function CreateContentPage() {
  return (
    <CreateGate>
      {({ slotsUsed, slotsTotal }) => <ContentTypePicker slotsUsed={slotsUsed} slotsTotal={slotsTotal} />}
    </CreateGate>
  );
}
