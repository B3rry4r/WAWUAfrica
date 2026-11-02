import { PlusIcon } from "./Icons";

export interface SiteFaqItem {
  question: string;
  answer: string;
}

/** Questions and answers as native <details>: they open without script and by keyboard. */
export function Faq({ items }: { items: readonly SiteFaqItem[] }) {
  return (
    <div className="border-t border-site-line">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-site-line">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 text-[clamp(1.1rem,2vw,1.3rem)] font-bold tracking-[-0.015em] text-site-deep marker:content-none [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-site-purple-tint text-site-purple transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
              <PlusIcon className="h-5 w-5" />
            </span>
          </summary>
          <p className="m-0 max-w-[62ch] pb-6 pr-12 text-[17px] leading-relaxed text-site-mute">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
