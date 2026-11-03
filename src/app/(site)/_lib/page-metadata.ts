import type { Metadata } from "next";

/** The link-preview pictures (1200 x 630), at the root of public/ so join-only mode serves them. */
export const OG_IMAGES = {
  brand: "/wawu-og-brand.png",
  whoMadeThis: "/wawu-og-who-made-this.png",
  voices: "/wawu-og-voices.png",
} as const;

/**
 * One page's metadata: its own title (not the app's "%s · WAWUAfrica"
 * template), description, canonical address and Open Graph and Twitter card
 * with a picture.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = OG_IMAGES.brand,
  imageAlt = "WAWU: apps that give people a name, a voice and a way to earn",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "WAWU",
      locale: "en_NG",
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
