import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CashFlowItem {
  description: string;
  amount: number;
}

interface CashAccount {
  id: string;
}

// GET: キャッシュフロー計算書データを取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

    // 期間を設定
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = new Date(endDate);

    // 現金勘定を特定（コードが100または101で始まるもの、または名前に「現金」「預金」を含む）
    const cashAccounts = await prisma.chartOfAccount.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { code: { startsWith: "100" } },
          { code: { startsWith: "101" } },
          { code: { startsWith: "102" } },
          { name: { contains: "現金" } },
          { name: { contains: "預金" } },
        ],
      },
    });

    const cashAccountIds = new Set<string>(cashAccounts.map((a: CashAccount) => a.id));

    // 期間内の仕訳を取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
        OR: [
          { debitAccountId: { in: Array.from(cashAccountIds) } },
          { creditAccountId: { in: Array.from(cashAccountIds) } },
        ],
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: { date: "asc" },
    });

    // 活動別に分類
    const operatingItems: CashFlowItem[] = [];
    const investingItems: CashFlowItem[] = [];
    const financingItems: CashFlowItem[] = [];

    // 勘定科目カテゴリから活動を判定
    const getActivityType = (account: typeof journals[0]["debitAccount"]): "operating" | "investing" | "financing" => {
      const category = account.category.toLowerCase();
      const name = account.name.toLowerCase();

      // 投資活動
      if (
        category.includes("固定資産") ||
        category.includes("投資") ||
        name.includes("有価証券") ||
        name.includes("設備") ||
        name.includes("機械") ||
        name.includes("建物") ||
        name.includes("土地")
      ) {
        return "investing";
      }

      // 財務活動
      if (
        category.includes("借入") ||
        category.includes("資本") ||
        category.includes("社債") ||
        name.includes("借入金") ||
        name.includes("社債") ||
        name.includes("配当") ||
        name.includes("増資") ||
        name.includes("自己株式")
      ) {
        return "financing";
      }

      // それ以外は営業活動
      return "operating";
    };

    for (const journal of journals) {
      let cashChange = 0;
      let counterAccount: typeof journal.debitAccount;
      let description = "";

      if (cashAccountIds.has(journal.debitAccountId)) {
        // 現金が増加（借方が現金）
        cashChange = journal.amount;
        counterAccount = journal.creditAccount;
        description = `${counterAccount.name}より`;
      } else {
        // 現金が減少（貸方が現金）
        cashChange = -journal.amount;
        counterAccount = journal.debitAccount;
        description = `${counterAccount.name}へ`;
      }

      if (journal.description) {
        description += ` (${journal.description})`;
      }

      const item: CashFlowItem = {
        description,
        amount: cashChange,
      };

      const activity = getActivityType(counterAccount);
      if (activity === "operating") {
        operatingItems.push(item);
      } else if (activity === "investing") {
        investingItems.push(item);
      } else {
        financingItems.push(item);
      }
    }

    // 各活動の合計を計算
    const operatingTotal = operatingItems.reduce((sum, item) => sum + item.amount, 0);
    const investingTotal = investingItems.reduce((sum, item) => sum + item.amount, 0);
    const financingTotal = financingItems.reduce((sum, item) => sum + item.amount, 0);
    const netChange = operatingTotal + investingTotal + financingTotal;

    // 期首・期末の現金残高を計算
    const beginningBalance = await calculateCashBalance(
      session.user.id,
      cashAccountIds,
      new Date(start.getTime() - 1) // 期首の前日まで
    );

    const endingBalance = beginningBalance + netChange;

    return NextResponse.json({
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      operating: {
        items: aggregateItems(operatingItems),
        total: operatingTotal,
      },
      investing: {
        items: aggregateItems(investingItems),
        total: investingTotal,
      },
      financing: {
        items: aggregateItems(financingItems),
        total: financingTotal,
      },
      summary: {
        operatingTotal,
        investingTotal,
        financingTotal,
        netChange,
        beginningBalance,
        endingBalance,
      },
    });
  } catch (error) {
    console.error("キャッシュフロー計算書取得エラー:", error);
    return NextResponse.json(
      { error: "キャッシュフロー計算書の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 現金残高を計算
async function calculateCashBalance(
  userId: string,
  cashAccountIds: Set<string>,
  endDate: Date
): Promise<number> {
  const journals = await prisma.journal.findMany({
    where: {
      userId,
      date: { lte: endDate },
      OR: [
        { debitAccountId: { in: Array.from(cashAccountIds) } },
        { creditAccountId: { in: Array.from(cashAccountIds) } },
      ],
    },
  });

  let balance = 0;
  for (const journal of journals) {
    if (cashAccountIds.has(journal.debitAccountId)) {
      balance += journal.amount;
    }
    if (cashAccountIds.has(journal.creditAccountId)) {
      balance -= journal.amount;
    }
  }

  return balance;
}

// 同じ説明の項目を集約
function aggregateItems(items: CashFlowItem[]): CashFlowItem[] {
  const aggregated = new Map<string, number>();
  for (const item of items) {
    const current = aggregated.get(item.description) || 0;
    aggregated.set(item.description, current + item.amount);
  }
  return Array.from(aggregated.entries())
    .map(([description, amount]) => ({ description, amount }))
    .filter((item) => item.amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}
