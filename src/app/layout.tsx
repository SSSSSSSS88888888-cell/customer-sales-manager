import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "ZaimuAI - AI財務諸表メーカー",
    template: "%s | ZaimuAI",
  },
  description: "仕訳入力だけで財務諸表（BS・PL・CF）を自動生成するAI財務諸表メーカー",
  keywords: ["財務諸表", "貸借対照表", "損益計算書", "キャッシュフロー", "仕訳", "会計", "AI"],
  authors: [{ name: "ZaimuAI Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
