import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraLace — Audio Modulation Studio",
  description: "Real-time speech and audio modulation using DSP techniques. Pitch shift, time stretch, bass boost.",
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