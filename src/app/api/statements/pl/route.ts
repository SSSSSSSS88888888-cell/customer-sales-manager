import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AccountBalance {
  code: string;
  name: string;
  category: string;
  amount: number;
}

interface PLSection {
  title: string;
  items: AccountBalance[];
  total: number;
}

// GET: 損益計算書データを取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

    // 期間を設定（デフォルトは今年度）
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1); // 1月1日
    const end = new Date(endDate);

    // 期間内の仕訳を取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    // 勘定科目別に金額を計算
    const amounts = new Map<string, { account: typeof journals[0]["debitAccount"]; amount: number }>();

    for (const journal of journals) {
      // 借方の処理
      const debitKey = journal.debitAccountId;
      const debitCurrent = amounts.get(debitKey) || { account: journal.debitAccount, amount: 0 };

      // 費用は借方で増加、収益は借方で減少
      if (journal.debitAccount.type === "EXPENSE") {
        debitCurrent.amount += journal.amount;
      } else if (journal.debitAccount.type === "REVENUE") {
        debitCurrent.amount -= journal.amount;
      }
      amounts.set(debitKey, debitCurrent);

      // 貸方の処理
      const creditKey = journal.creditAccountId;
      const creditCurrent = amounts.get(creditKey) || { account: journal.creditAccount, amount: 0 };

      // 収益は貸方で増加、費用は貸方で減少
      if (journal.creditAccount.type === "REVENUE") {
        creditCurrent.amount += journal.amount;
      } else if (journal.creditAccount.type === "EXPENSE") {
        creditCurrent.amount -= journal.amount;
      }
      amounts.set(creditKey, creditCurrent);
    }

    // カテゴリ別に分類
    const revenues: AccountBalance[] = [];
    const expenses: AccountBalance[] = [];

    Array.from(amounts.values()).forEach((data) => {
      if (data.amount === 0) return;
      if (data.account.type !== "REVENUE" && data.account.type !== "EXPENSE") return;

      const item: AccountBalance = {
        code: data.account.code,
        name: data.account.name,
        category: data.account.category,
        amount: Math.abs(data.amount),
      };

      if (data.account.type === "REVENUE") {
        revenues.push(item);
      } else {
        expenses.push(item);
      }
    });

    // コード順にソート
    revenues.sort((a, b) => a.code.localeCompare(b.code));
    expenses.sort((a, b) => a.code.localeCompare(b.code));

    // カテゴリ別に集計する関数
    const groupByCategory = (items: AccountBalance[]): PLSection[] => {
      const categories = new Map<string, AccountBalance[]>();
      for (const item of items) {
        const list = categories.get(item.category) || [];
        list.push(item);
        categories.set(item.category, list);
      }
      return Array.from(categories.entries()).map(([title, items]) => ({
        title,
        items,
        total: items.reduce((sum, item) => sum + item.amount, 0),
      }));
    };

    // カテゴリ別データ作成
    const revenueSections = groupByCategory(revenues);
    const expenseSections = groupByCategory(expenses);

    // 各カテゴリの合計を計算
    const getCategoryTotal = (sections: PLSection[], category: string): number => {
      const section = sections.find((s) => s.title === category);
      return section?.total || 0;
    };

    // 損益計算書の各項目を計算
    const sales = getCategoryTotal(revenueSections, "売上高");
    const costOfSales = getCategoryTotal(expenseSections, "売上原価");
    const grossProfit = sales - costOfSales;

    const sgaExpenses = getCategoryTotal(expenseSections, "販売費及び一般管理費");
    const operatingIncome = grossProfit - sgaExpenses;

    const nonOperatingRevenue = getCategoryTotal(revenueSections, "営業外収益");
    const nonOperatingExpenses = getCategoryTotal(expenseSections, "営業外費用");
    const ordinaryIncome = operatingIncome + nonOperatingRevenue - nonOperatingExpenses;

    const extraordinaryGains = getCategoryTotal(revenueSections, "特別利益");
    const extraordinaryLosses = getCategoryTotal(expenseSections, "特別損失");
    const incomeBeforeTax = ordinaryIncome + extraordinaryGains - extraordinaryLosses;

    const taxes = getCategoryTotal(expenseSections, "法人税等");
    const netIncome = incomeBeforeTax - taxes;

    return NextResponse.json({
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      revenues: {
        sections: revenueSections,
        total: revenues.reduce((sum, r) => sum + r.amount, 0),
      },
      expenses: {
        sections: expenseSections,
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
      },
      summary: {
        sales,
        costOfSales,
        grossProfit,
        sgaExpenses,
        operatingIncome,
        nonOperatingRevenue,
        nonOperatingExpenses,
        ordinaryIncome,
        extraordinaryGains,
        extraordinaryLosses,
        incomeBeforeTax,
        taxes,
        netIncome,
      },
    });
  } catch (error) {
    console.error("損益計算書取得エラー:", error);
    return NextResponse.json(
      { error: "損益計算書の取得に失敗しました" },
      { status: 500 }
    );
  }
}
