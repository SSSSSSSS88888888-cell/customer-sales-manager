import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "仕訳管理",
};

export default function JournalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
