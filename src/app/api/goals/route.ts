import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GoalPeriod を文字列リテラルとして定義
type GoalPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

interface SalesGoal {
  id: string;
  period: GoalPeriod;
  year: number;
  month: number | null;
  quarter: number | null;
  targetAmount: number;
}

interface JournalWithAccount {
  amount: number;
  date: Date;
  creditAccount: {
    type: string;
  };
}

// GET: 目標一覧と達成率を取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 目標を取得
    const goals = await prisma.salesGoal.findMany({
      where: {
        userId: session.user.id,
        year,
      },
      orderBy: [{ period: "asc" }, { month: "asc" }, { quarter: "asc" }],
    });

    // 売上実績を取得（収益勘定の貸方合計）
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        creditAccount: { select: { type: true } },
      },
    });

    // 月別売上を計算
    const monthlySales: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      monthlySales[m] = 0;
    }

    journals.forEach((j: JournalWithAccount) => {
      if (j.creditAccount.type === "REVENUE") {
        const month = new Date(j.date).getMonth() + 1;
        monthlySales[month] += j.amount;
      }
    });

    // 各目標に達成率を追加
    const goalsWithProgress = goals.map((goal: SalesGoal) => {
      let actualAmount = 0;

      if (goal.period === "MONTHLY" && goal.month) {
        actualAmount = monthlySales[goal.month] || 0;
      } else if (goal.period === "QUARTERLY" && goal.quarter) {
        const startMonth = (goal.quarter - 1) * 3 + 1;
        for (let m = startMonth; m < startMonth + 3; m++) {
          actualAmount += monthlySales[m] || 0;
        }
      } else if (goal.period === "YEARLY") {
        actualAmount = Object.values(monthlySales).reduce((sum, val) => sum + val, 0);
      }

      const achievementRate = goal.targetAmount > 0
        ? Math.round((actualAmount / goal.targetAmount) * 100)
        : 0;

      return {
        ...goal,
        actualAmount,
        achievementRate,
      };
    });

    // 年間サマリー
    const yearlyTotal = Object.values(monthlySales).reduce((sum, val) => sum + val, 0);
    const yearlyGoal = goals.find((g: SalesGoal) => g.period === "YEARLY");
    const yearlyTarget = yearlyGoal?.targetAmount || 0;
    const yearlyAchievementRate = yearlyTarget > 0
      ? Math.round((yearlyTotal / yearlyTarget) * 100)
      : 0;

    return NextResponse.json({
      goals: goalsWithProgress,
      summary: {
        yearlyTotal,
        yearlyTarget,
        yearlyAchievementRate,
        monthlySales,
      },
    });
  } catch (error) {
    console.error("目標取得エラー:", error);
    return NextResponse.json(
      { error: "目標の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 目標作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { name, period, year, month, quarter, targetAmount, notes } = body;

    if (!name || !period || !year || !targetAmount) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // 期間タイプに応じたバリデーション
    if (period === "MONTHLY" && (!month || month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "月次目標には有効な月が必要です" },
        { status: 400 }
      );
    }

    if (period === "QUARTERLY" && (!quarter || quarter < 1 || quarter > 4)) {
      return NextResponse.json(
        { error: "四半期目標には有効な四半期が必要です" },
        { status: 400 }
      );
    }

    const goal = await prisma.salesGoal.create({
      data: {
        userId: session.user.id,
        name,
        period,
        year,
        month: period === "MONTHLY" ? month : null,
        quarter: period === "QUARTERLY" ? quarter : null,
        targetAmount,
        notes: notes || null,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("目標作成エラー:", error);
    return NextResponse.json(
      { error: "目標の作成に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 目標削除
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "目標IDが必要です" },
        { status: 400 }
      );
    }

    // 所有者確認
    const existing = await prisma.salesGoal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "目標が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.salesGoal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "目標を削除しました" });
  } catch (error) {
    console.error("目標削除エラー:", error);
    return NextResponse.json(
      { error: "目標の削除に失敗しました" },
      { status: 500 }
    );
  }
}
