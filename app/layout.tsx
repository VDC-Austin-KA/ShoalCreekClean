import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shoal Creek Clean — Commercial Power Washing, Austin TX", template: "%s · Shoal Creek Clean" },
  description: "Photo-verified commercial and residential exterior cleaning across Austin, Round Rock, Pflugerville and Cedar Park. Instant online quotes.",
};
export const viewport: Viewport = { themeColor: "#07090d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
