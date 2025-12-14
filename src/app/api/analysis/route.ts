import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface FinancialRatio {
  name: string;
  value: number | null;
  unit: string;
  benchmark: number;
  benchmarkLabel: string;
  isHigherBetter: boolean;
  category: string;
}

// GET: 財務指標を計算
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const startDate = searchParams.get("startDate") || `${new Date().getFullYear()}-01-01`;

    // 仕訳データを取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    // 勘定科目別の残高を計算
    const balances = new Map<string, { account: typeof journals[0]["debitAccount"]; balance: number }>();

    for (const journal of journals) {
      // 借方
      const debitKey = journal.debitAccountId;
      const debitCurrent = balances.get(debitKey) || { account: journal.debitAccount, balance: 0 };
      if (journal.debitAccount.type === "ASSET" || journal.debitAccount.type === "EXPENSE") {
        debitCurrent.balance += journal.amount;
      } else {
        debitCurrent.balance -= journal.amount;
      }
      balances.set(debitKey, debitCurrent);

      // 貸方
      const creditKey = journal.creditAccountId;
      const creditCurrent = balances.get(creditKey) || { account: journal.creditAccount, balance: 0 };
      if (journal.creditAccount.type === "ASSET" || journal.creditAccount.type === "EXPENSE") {
        creditCurrent.balance -= journal.amount;
      } else {
        creditCurrent.balance += journal.amount;
      }
      balances.set(creditKey, creditCurrent);
    }

    // カテゴリ別集計
    let currentAssets = 0;      // 流動資産
    let fixedAssets = 0;        // 固定資産
    let currentLiabilities = 0; // 流動負債
    let fixedLiabilities = 0;   // 固定負債
    let equity = 0;             // 自己資本
    let sales = 0;              // 売上高
    let costOfSales = 0;        // 売上原価
    let sgaExpenses = 0;        // 販管費
    let nonOperatingRevenue = 0;
    let nonOperatingExpenses = 0;
    let quickAssets = 0;        // 当座資産（現金・預金・売掛金）
    let receivables = 0;        // 売上債権

    Array.from(balances.values()).forEach((data) => {
      const { account, balance } = data;
      const absBalance = Math.abs(balance);

      if (account.type === "ASSET") {
        if (account.category === "流動資産") {
          currentAssets += absBalance;
          // 当座資産（現金、預金、売掛金）
          if (["現金", "普通預金", "当座預金", "売掛金"].includes(account.name)) {
            quickAssets += absBalance;
          }
          if (account.name === "売掛金") {
            receivables += absBalance;
          }
        } else if (account.category === "固定資産") {
          fixedAssets += absBalance;
        }
      } else if (account.type === "LIABILITY") {
        if (account.category === "流動負債") {
          currentLiabilities += absBalance;
        } else if (account.category === "固定負債") {
          fixedLiabilities += absBalance;
        }
      } else if (account.type === "EQUITY") {
        equity += absBalance;
      } else if (account.type === "REVENUE") {
        if (account.category === "売上高") {
          sales += absBalance;
        } else {
          nonOperatingRevenue += absBalance;
        }
      } else if (account.type === "EXPENSE") {
        if (account.category === "売上原価") {
          costOfSales += absBalance;
        } else if (account.category === "販売費及び一般管理費") {
          sgaExpenses += absBalance;
        } else if (account.category === "営業外費用") {
          nonOperatingExpenses += absBalance;
        }
      }
    });

    // 各種利益の計算
    const totalAssets = currentAssets + fixedAssets;
    const totalLiabilities = currentLiabilities + fixedLiabilities;
    const totalCapital = totalLiabilities + equity;
    const grossProfit = sales - costOfSales;
    const operatingIncome = grossProfit - sgaExpenses;
    const ordinaryIncome = operatingIncome + nonOperatingRevenue - nonOperatingExpenses;
    const netIncome = ordinaryIncome; // 簡易計算（税引前利益を使用）

    // 安全性指標
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : null;
    const quickRatio = currentLiabilities > 0 ? (quickAssets / currentLiabilities) * 100 : null;
    const equityRatio = totalCapital > 0 ? (equity / totalCapital) * 100 : null;

    // 収益性指標
    const grossProfitMargin = sales > 0 ? (grossProfit / sales) * 100 : null;
    const operatingProfitMargin = sales > 0 ? (operatingIncome / sales) * 100 : null;
    const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : null;
    const roe = equity > 0 ? (netIncome / equity) * 100 : null;

    // 効率性指標
    const totalAssetTurnover = totalAssets > 0 ? sales / totalAssets : null;
    const receivablesTurnover = receivables > 0 ? sales / receivables : null;

    const ratios: FinancialRatio[] = [
      // 安全性指標
      {
        name: "流動比率",
        value: currentRatio,
        unit: "%",
        benchmark: 200,
        benchmarkLabel: "200%以上が理想",
        isHigherBetter: true,
        category: "安全性",
      },
      {
        name: "当座比率",
        value: quickRatio,
        unit: "%",
        benchmark: 100,
        benchmarkLabel: "100%以上が理想",
        isHigherBetter: true,
        category: "安全性",
      },
      {
        name: "自己資本比率",
        value: equityRatio,
        unit: "%",
        benchmark: 40,
        benchmarkLabel: "40%以上が安定",
        isHigherBetter: true,
        category: "安全性",
      },
      // 収益性指標
      {
        name: "売上高総利益率",
        value: grossProfitMargin,
        unit: "%",
        benchmark: 20,
        benchmarkLabel: "業種により異なる",
        isHigherBetter: true,
        category: "収益性",
      },
      {
        name: "売上高営業利益率",
        value: operatingProfitMargin,
        unit: "%",
        benchmark: 5,
        benchmarkLabel: "5%以上が目安",
        isHigherBetter: true,
        category: "収益性",
      },
      {
        name: "ROA（総資産利益率）",
        value: roa,
        unit: "%",
        benchmark: 5,
        benchmarkLabel: "5%以上が優良",
        isHigherBetter: true,
        category: "収益性",
      },
      {
        name: "ROE（自己資本利益率）",
        value: roe,
        unit: "%",
        benchmark: 10,
        benchmarkLabel: "10%以上が優良",
        isHigherBetter: true,
        category: "収益性",
      },
      // 効率性指標
      {
        name: "総資産回転率",
        value: totalAssetTurnover,
        unit: "回",
        benchmark: 1,
        benchmarkLabel: "1回以上が目安",
        isHigherBetter: true,
        category: "効率性",
      },
      {
        name: "売上債権回転率",
        value: receivablesTurnover,
        unit: "回",
        benchmark: 6,
        benchmarkLabel: "6回以上が目安",
        isHigherBetter: true,
        category: "効率性",
      },
    ];

    return NextResponse.json({
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalAssets,
        totalLiabilities,
        equity,
        sales,
        grossProfit,
        operatingIncome,
        netIncome,
      },
      ratios,
    });
  } catch (error) {
    console.error("財務分析エラー:", error);
    return NextResponse.json(
      { error: "財務分析の取得に失敗しました" },
      { status: 500 }
    );
  }
}
