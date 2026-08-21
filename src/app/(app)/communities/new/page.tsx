import { CreateCommunity } from "@/components/communities/CreateCommunity";

export const metadata = {
  title: "New community · WAWUAfrica",
};

/**
 * Static segment, so it wins over the sibling `[id]` route the same way
 * /marketplace/search already wins over /marketplace/[shop].
 */
export default function NewCommunityPage() {
  return <CreateCommunity />;
}
