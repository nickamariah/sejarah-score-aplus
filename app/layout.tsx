import type { Metadata, Viewport } from "next";
import "./globals.css";

// 🌟 1. TAMBAH VIEWPORT UNTUK PWA (Warna header di telefon bimbit)
export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 🌟 2. KEMAS KINI METADATA (Tambah manifest.json)
export const metadata: Metadata = {
  title: "Smart Learning Hub I-RAGS",
  description: "Platform pembelajaran sejarah interaktif untuk murid.",
  manifest: "/manifest.json", // <-- INI FAIL PWA YANG KITA BUAT TADI
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