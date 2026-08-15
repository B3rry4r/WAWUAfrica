import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WAWUAfrica — African expertise, finally paid for",
  description:
    "Publish what you know, price it in naira, and let your audience unlock it. Keep up to 90% of what you earn on WAWUAfrica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}