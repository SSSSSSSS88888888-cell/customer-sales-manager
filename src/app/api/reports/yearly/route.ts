import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Sale {
  id: string;
  amount: number;
  saleDate: Date;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 過去12ヶ月分のデータを取得
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    const startDate = new Date(year, 0, 1);

    const sales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 月別に集計
    const monthlyData: Record<number, { amount: number; count: number }> = {};

    // 全ての月を初期化
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { amount: 0, count: 0 };
    }

    // 売上データを月別に集計
    sales.forEach((sale: Sale) => {
      const month = sale.saleDate.getMonth() + 1;
      monthlyData[month].amount += sale.amount;
      monthlyData[month].count += 1;
    });

    // 配列形式に変換
    const monthlySales = Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      monthLabel: `${month}月`,
      amount: data.amount,
      count: data.count,
    }));

    // 年間合計
    const yearlyTotal = sales.reduce((sum: number, sale: Sale) => sum + sale.amount, 0);

    return NextResponse.json({
      year,
      monthlySales,
      yearlyTotal,
      transactionCount: sales.length,
    });
  } catch (error) {
    console.error("Error fetching yearly report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
