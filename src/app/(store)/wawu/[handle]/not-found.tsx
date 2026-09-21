import { Button, EmptyState } from "@/components/ui";
import { StoreHeader } from "../../components/StoreChrome";

/**
 * A store link that resolves to nobody.
 *
 * Reached when the handle matches no account, or when the store could not be
 * read at all. It is still a public page, and C10's rule holds hardest here:
 * the one screen with nothing on it must not also be the one screen with
 * nowhere to go.
 */
export default function StoreNotFound() {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-[18px] px-[16px] py-[42px] xl:px-[26px]">
        <EmptyState
          icon="Store"
          title="No store at this link"
          caption="The link may have been mistyped, or this person has changed their WAWU name. Their new link will work."
        />
        <div className="mx-auto flex w-full max-w-[420px] flex-col gap-[10px]">
          <Button href="/" full>
            See what WAWU is
          </Button>
          <Button href="/sign-up" variant="secondary" full>
            Create an account
          </Button>
        </div>
      </main>
    </>
  );
}
