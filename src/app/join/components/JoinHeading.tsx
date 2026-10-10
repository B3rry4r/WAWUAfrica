/**
 * The eyebrow and heading at the top of the registration form. Also drawn by
 * the loading state, so the page's very first paint (the static HTML, before
 * any script has run) already says what this page is.
 */
export function JoinHeading() {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent-hover">Event registration</span>
      <h1 className="m-0 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary dt:text-[44px]">
        Register for WAWU
      </h1>
    </div>
  );
}
