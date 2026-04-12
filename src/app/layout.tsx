import type { Metadata, Viewport } from "next";
import { Noto_Serif, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

/**
 * Noto Serif — body text, Vietnamese/Latin
 * Loaded with vietnamese subset for proper diacritic rendering.
 */
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  display: "swap",
});

/**
 * Noto Serif SC — Chinese character display (Simplified Chinese)
 * Not preloaded to avoid blocking render (large font file).
 */
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  // "chinese-simplified" is loaded by default for SC fonts; only list latin here
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  applicationName: "Hiểu Chữ Hán",
  title: "Hiểu Chữ Hán — Từ điển Hán Việt",
  description:
    "Tra cứu chữ Hán nhanh chóng: nghĩa tiếng Việt, cách đọc Hán Việt, hoạt ảnh nét chữ, phân tích tự nguyên.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hiểu Chữ Hán",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${notoSerif.variable} ${notoSerifSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-serif">
        {children}
      </body>
    </html>
  );
}
