import { MyTicketsList } from "@/components/events/MyTicketsList";

/**
 * /tickets — every ticket this account holds, with the QR for each.
 *
 * A top-level route rather than a tab inside /events, because this is what
 * somebody opens while standing in a queue. Reachable from Settings, from the
 * events calendar, and directly after a purchase.
 */
export default function MyTicketsPage() {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[900px] xl:p-[30px_28px_64px]">
      <div className="flex flex-col gap-[4px]">
        <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
          My tickets
        </h1>
        <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
          Show the QR at the door. The code underneath it works too, if the scanner will not read your screen.
        </p>
      </div>
      <MyTicketsList />
    </div>
  );
}
