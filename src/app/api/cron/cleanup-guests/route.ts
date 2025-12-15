import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface GuestUser {
  id: string;
}

// Vercel Cron認証用（環境変数で設定）
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Cron認証（Vercel Cron用）
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 24時間前の日時を計算
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // 削除対象のゲストユーザーを取得
    const expiredGuests = await prisma.user.findMany({
      where: {
        isGuest: true,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredGuests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired guests found",
        deleted: 0,
      });
    }

    const guestIds = expiredGuests.map((g: GuestUser) => g.id);

    // 関連データを削除
    await prisma.journal.deleteMany({
      where: { userId: { in: guestIds } },
    });

    await prisma.chartOfAccount.deleteMany({
      where: { userId: { in: guestIds } },
    });

    await prisma.session.deleteMany({
      where: { userId: { in: guestIds } },
    });

    await prisma.account.deleteMany({
      where: { userId: { in: guestIds } },
    });

    // ゲストユーザーを削除
    const result = await prisma.user.deleteMany({
      where: { id: { in: guestIds } },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} expired guest users`,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
