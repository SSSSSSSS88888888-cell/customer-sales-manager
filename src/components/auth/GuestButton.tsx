"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";

export function GuestButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsLoading(true);

    try {
      // ゲストユーザーを作成
      const response = await fetch("/api/auth/guest", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("ゲストユーザーの作成に失敗しました");
      }

      const { email } = await response.json();

      // ゲストとしてログイン
      await signIn("credentials", {
        email,
        isGuest: "true",
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Guest login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGuestLogin}
      disabled={isLoading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          準備中...
        </>
      ) : (
        <>
          <User className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span>ゲストとして試す</span>
            <span className="text-xs font-normal opacity-90">登録不要・1分で体験</span>
          </div>
        </>
      )}
    </Button>
  );
}
