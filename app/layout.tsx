import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Letters — a space for two", template: "%s · Letters" },
  description: "Your letters, memories, and everything in between.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
