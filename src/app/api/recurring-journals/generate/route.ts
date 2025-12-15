import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Frequency } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST: 定期仕訳から仕訳を生成
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // アクティブな定期仕訳を取得
    const recurringJournals = await prisma.recurringJournal.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
    });

    let generatedCount = 0;
    const errors: string[] = [];

    for (const rj of recurringJournals) {
      try {
        const shouldGenerate = checkShouldGenerate(rj, today);

        if (shouldGenerate) {
          // 仕訳を作成
          await prisma.journal.create({
            data: {
              userId: session.user.id,
              date: today,
              debitAccountId: rj.debitAccountId,
              creditAccountId: rj.creditAccountId,
              amount: rj.amount,
              description: rj.description ? `[定期] ${rj.description}` : `[定期] ${rj.name}`,
            },
          });

          // 最終生成日を更新
          await prisma.recurringJournal.update({
            where: { id: rj.id },
            data: { lastGeneratedAt: today },
          });

          generatedCount++;
        }
      } catch (error) {
        console.error(`定期仕訳ID ${rj.id} の生成エラー:`, error);
        errors.push(`${rj.name}: 生成に失敗しました`);
      }
    }

    return NextResponse.json({
      message: `${generatedCount}件の仕訳を生成しました`,
      generated: generatedCount,
      errors,
    });
  } catch (error) {
    console.error("定期仕訳生成エラー:", error);
    return NextResponse.json(
      { error: "定期仕訳の生成に失敗しました" },
      { status: 500 }
    );
  }
}

function checkShouldGenerate(
  rj: {
    frequency: Frequency;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    lastGeneratedAt: Date | null;
  },
  today: Date
): boolean {
  const lastGenerated = rj.lastGeneratedAt;

  // 今日すでに生成済みならスキップ
  if (lastGenerated) {
    const lastDate = new Date(lastGenerated);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === today.getTime()) {
      return false;
    }
  }

  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  switch (rj.frequency) {
    case "DAILY":
      return true;

    case "WEEKLY":
      // 指定曜日と一致するか
      return rj.dayOfWeek === dayOfWeek;

    case "MONTHLY":
      // 指定日と一致するか（月末処理含む）
      if (!rj.dayOfMonth) return false;
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(rj.dayOfMonth, lastDayOfMonth);
      return dayOfMonth === targetDay;

    case "YEARLY":
      // 開始日と同じ月日か
      // Note: startDateから月日を取得して比較する必要があるが、
      // ここでは dayOfMonth を月、lastGeneratedAt の日として簡易的に処理
      return false; // 年次は複雑なので別途実装

    default:
      return false;
  }
}
