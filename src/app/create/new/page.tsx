import { CONTENT_TYPES, type ContentType } from "@/types/content";
import { libraryItems } from "@/lib/api/content";
import { PublishingWizard } from "@/components/create/PublishingWizard";

export const metadata = {
  title: "New content · WAWUAfrica",
};

interface Props {
  searchParams: { type?: string; first?: string };
}

export default function NewContentPage({ searchParams }: Props) {
  const type: ContentType = CONTENT_TYPES.includes(searchParams.type as ContentType)
    ? (searchParams.type as ContentType)
    : "video";

  const hasPublished = libraryItems.some((i) => i.status === "live");
  const firstUpload = searchParams.first === "1" ? true : !hasPublished;

  return <PublishingWizard type={type} firstUpload={firstUpload} />;
}
