/** Delivery model for an upload. Grouped in the type picker by how it is delivered. */
export type ContentType =
  | "video"
  | "course"
  | "audio"
  | "pdf"
  | "image"
  | "template";

export const CONTENT_TYPES: ContentType[] = [
  "video",
  "course",
  "audio",
  "pdf",
  "image",
  "template",
];

export interface ContentTypeMeta {
  label: string;
  group: "stream" | "download";
  blurb: string;
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  video: { label: "Video", group: "stream", blurb: "One lesson or a talk" },
  course: { label: "Course", group: "stream", blurb: "Several lessons in order" },
  audio: { label: "Audio", group: "download", blurb: "Music, stems, podcast" },
  pdf: { label: "PDF or book", group: "download", blurb: "Guides, workbooks" },
  image: { label: "Image or art", group: "download", blurb: "Prints, design pieces" },
  template: { label: "Template", group: "download", blurb: "Invoices, sheets, forms" },
};

export type ContentStatus = "live" | "review" | "rejected";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  /** File description shown under the title, e.g. "PDF · 34 pages · ₦1,500". */
  meta: string;
  /** Naira price; 0 means free. */
  price: number;
  status: ContentStatus;
  /** Lifetime earnings (paid content only). */
  earned?: number;
  /** Sales/views count. */
  activity?: string;
  /** True for the first, free upload. */
  isFirstUpload?: boolean;
  /** Rejection reason shown to the creator. */
  rejectionReason?: string;
}
