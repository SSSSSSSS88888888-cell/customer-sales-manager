import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "財務諸表",
};

export default function StatementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
