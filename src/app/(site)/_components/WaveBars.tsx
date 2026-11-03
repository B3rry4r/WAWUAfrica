import { cn } from "@/lib/cn";

// Heights and start times differ so the bars never move in step. The class
// names are written out in full so Tailwind can see them.
const BARS = [
  "h-[30%] [animation-delay:0ms]",
  "h-[55%] [animation-delay:140ms]",
  "h-[80%] [animation-delay:280ms]",
  "h-[45%] [animation-delay:420ms]",
  "h-[95%] [animation-delay:70ms]",
  "h-[60%] [animation-delay:210ms]",
  "h-[35%] [animation-delay:350ms]",
  "h-[75%] [animation-delay:490ms]",
  "h-[50%] [animation-delay:120ms]",
  "h-[90%] [animation-delay:260ms]",
  "h-[40%] [animation-delay:400ms]",
  "h-[65%] [animation-delay:30ms]",
  "h-[85%] [animation-delay:170ms]",
  "h-[35%] [animation-delay:310ms]",
  "h-[70%] [animation-delay:450ms]",
  "h-[50%] [animation-delay:90ms]",
  "h-[92%] [animation-delay:230ms]",
  "h-[42%] [animation-delay:370ms]",
  "h-[68%] [animation-delay:10ms]",
  "h-[30%] [animation-delay:190ms]",
  "h-[78%] [animation-delay:330ms]",
  "h-[52%] [animation-delay:470ms]",
  "h-[88%] [animation-delay:110ms]",
  "h-[38%] [animation-delay:250ms]",
];

/** A sound wave: the picture of VOICES. Decorative; it only moves when motion is allowed. */
export function WaveBars({ className, barClassName }: { className?: string; barClassName?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center justify-between gap-[5px]", className)}>
      {BARS.map((bar, i) => (
        <span key={i} className={cn("site-bar block w-full max-w-[10px] rounded-full bg-white", bar, barClassName)} />
      ))}
    </div>
  );
}
