import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 予算一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        year,
      },
      orderBy: [{ month: "asc" }, { category: "asc" }],
    });

    // 実績データを取得
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    // 月別実績を計算
    const actualData: Record<string, Record<string, number>> = {};

    for (let m = 1; m <= 12; m++) {
      actualData[m] = { sales: 0, expenses: 0 };
    }

    for (const journal of journals) {
      const month = new Date(journal.date).getMonth() + 1;

      if (journal.creditAccount.type === "REVENUE") {
        actualData[month].sales += journal.amount;
      }
      if (journal.debitAccount.type === "EXPENSE") {
        actualData[month].expenses += journal.amount;
      }
    }

    // 予算と実績をマージ
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const salesBudget = budgets.find(b => b.month === m && b.category === "sales");
      const expensesBudget = budgets.find(b => b.month === m && b.category === "expenses");

      monthlyData.push({
        month: m,
        monthLabel: `${m}月`,
        salesBudget: salesBudget?.amount || 0,
        salesActual: actualData[m].sales,
        expensesBudget: expensesBudget?.amount || 0,
        expensesActual: actualData[m].expenses,
        profitBudget: (salesBudget?.amount || 0) - (expensesBudget?.amount || 0),
        profitActual: actualData[m].sales - actualData[m].expenses,
      });
    }

    // 年間合計
    const yearlyTotal = {
      salesBudget: monthlyData.reduce((sum, m) => sum + m.salesBudget, 0),
      salesActual: monthlyData.reduce((sum, m) => sum + m.salesActual, 0),
      expensesBudget: monthlyData.reduce((sum, m) => sum + m.expensesBudget, 0),
      expensesActual: monthlyData.reduce((sum, m) => sum + m.expensesActual, 0),
      profitBudget: 0,
      profitActual: 0,
    };
    yearlyTotal.profitBudget = yearlyTotal.salesBudget - yearlyTotal.expensesBudget;
    yearlyTotal.profitActual = yearlyTotal.salesActual - yearlyTotal.expensesActual;

    return NextResponse.json({
      year,
      monthlyData,
      yearlyTotal,
      budgets,
    });
  } catch (error) {
    console.error("予算取得エラー:", error);
    return NextResponse.json(
      { error: "予算の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 予算登録/更新
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { year, month, category, amount } = await request.json();

    if (!year || !month || !category || amount === undefined) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_year_month_category: {
          userId: session.user.id,
          year,
          month,
          category,
        },
      },
      update: { amount },
      create: {
        userId: session.user.id,
        year,
        month,
        category,
        amount,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("予算登録エラー:", error);
    return NextResponse.json(
      { error: "予算の登録に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 予算削除
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { year, month, category } = await request.json();

    await prisma.budget.delete({
      where: {
        userId_year_month_category: {
          userId: session.user.id,
          year,
          month,
          category,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("予算削除エラー:", error);
    return NextResponse.json(
      { error: "予算の削除に失敗しました" },
      { status: 500 }
    );
  }
}
