"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GuestBanner } from "./GuestBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isGuest?: boolean;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ゲストバナー */}
      {user.isGuest && <GuestBanner />}

      {/* サイドバー */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* メインコンテンツエリア */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* ヘッダー */}
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
