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
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="hidden md:block">{user.name || user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
