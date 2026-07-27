import type { Metadata, Viewport } from "next";
import "./globals.css";
import { assetPath } from "./paths";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ??
      "https://nthu-library-counter-english.nthu-library-8643.chatgpt.site",
  ),
  title: "清大圖書館英語情境練習室",
  description: "國立清華大學圖書館櫃台館員英語情境、句型、文法與單字練習。",
  manifest: assetPath("/manifest.webmanifest"),
  applicationName: "清大圖書館英語練習室",
  icons: {
    icon: assetPath("/img_20260726120102.png"),
    apple: assetPath("/img_20260726120102.png"),
  },
  openGraph: {
    title: "清大圖書館英語情境練習室",
    description: "二十個櫃台服務情境，120 WPM 中英朗讀、句型文法與角色扮演。",
    type: "website",
    images: [assetPath("/og.png")],
  },
  twitter: {
    card: "summary_large_image",
    title: "清大圖書館英語情境練習室",
    description: "二十個櫃台服務情境，120 WPM 中英朗讀、句型文法與角色扮演。",
    images: [assetPath("/og.png")],
  },
};

export const viewport: Viewport = {
  themeColor: "#5a294f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
