"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Menu } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b shadow-sm px-4 flex items-center justify-between sticky top-0 z-30">
      {/* モバイルメニューボタン */}
      <div className="flex items-center md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-slate-600 hover:text-slate-900"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* デスクトップ：空きスペース */}
      <div className="hidden md:block flex-1" />

      {/* ユーザーメニュー */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="hidden sm:block text-slate-700 font-medium">
              {user.name || user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-slate-700">マイアカウント</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-slate-600">
            <User className="mr-2 h-4 w-4" />
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
