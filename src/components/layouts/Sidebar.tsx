"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, DollarSign, BarChart3, LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { name: "顧客管理", href: "/customers", icon: Users },
  { name: "売上管理", href: "/sales", icon: DollarSign },
  { name: "レポート", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Sales Manager</h1>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* デスクトップサイドバー */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-slate-900 overflow-y-auto">
          {sidebarContent}
        </div>
      </div>

      {/* モバイルサイドバー（オーバーレイ） */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
          {/* サイドバー */}
          <div className="fixed inset-y-0 left-0 w-60 bg-slate-900 z-50 md:hidden flex flex-col">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
