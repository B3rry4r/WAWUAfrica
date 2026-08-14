import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WAWUAfrica",
  description: "African expertise, finally paid for.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
