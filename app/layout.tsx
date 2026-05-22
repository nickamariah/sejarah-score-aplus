import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sejarah Score A+ Smart Learning",
  description: "Platform pembelajaran sejarah interaktif untuk murid.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
