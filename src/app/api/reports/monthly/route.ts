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
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // 当月の開始日と終了日
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 前月の開始日と終了日
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // 当月の売上データを取得
    const currentMonthSales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { saleDate: "asc" },
    });

    // 前月の売上合計を取得
    const prevMonthSales = await prisma.sale.aggregate({
      where: {
        userId: session.user.id,
        saleDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 当月の売上合計
    const totalAmount = currentMonthSales.reduce((sum: number, sale: Sale) => sum + sale.amount, 0);
    const prevTotalAmount = prevMonthSales._sum.amount || 0;

    // 前月比（増減率%）
    let changeRate = 0;
    if (prevTotalAmount > 0) {
      changeRate = ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
    } else if (totalAmount > 0) {
      changeRate = 100;
    }

    // 日別売上データを集計
    const dailyData: Record<string, number> = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    // 全ての日を初期化
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dailyData[dateKey] = 0;
    }

    // 売上データを日別に集計
    currentMonthSales.forEach((sale: Sale) => {
      const dateKey = sale.saleDate.toISOString().split("T")[0];
      dailyData[dateKey] = (dailyData[dateKey] || 0) + sale.amount;
    });

    // 配列形式に変換
    const dailySales = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      year,
      month,
      totalAmount,
      prevTotalAmount,
      changeRate: Math.round(changeRate * 10) / 10,
      transactionCount: currentMonthSales.length,
      dailySales,
    });
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
