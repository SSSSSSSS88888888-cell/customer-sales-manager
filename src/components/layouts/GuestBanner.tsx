"use client";

import Link from "next/link";
import { User, ArrowRight } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="bg-red-50 border-b border-red-200 md:pl-60">
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-red-800">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              ゲストモードで利用中
            </span>
            <span className="text-xs text-red-600">
              （データは24時間後に削除されます）
            </span>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
          >
            本登録はこちら
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
