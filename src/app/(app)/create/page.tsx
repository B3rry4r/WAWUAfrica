import { CreateHub } from "@/components/create/CreateHub";
import { PLANS } from "@/types/subscription";
import { currentSession } from "@/lib/api/mocks/session";

export const metadata = {
  title: "Create · WAWUAfrica",
};

export default function CreatePage() {
  const creator = currentSession.creator;
  const tier = creator?.tier ?? "basic";
  const plan = PLANS[tier];
  const slotsTotal = creator?.slotsTotal ?? plan.slots;
  const slotsUsed = creator?.slotsUsed ?? 0;

  return (
    <CreateHub
      slotsUsed={slotsUsed}
      slotsTotal={slotsTotal}
      slotFree={slotsUsed < slotsTotal}
      tier={tier}
      proPrice={PLANS.pro.price}
      proSlots={PLANS.pro.slots}
    />
  );
}
