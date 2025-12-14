import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AccountBalance {
  code: string;
  name: string;
  category: string;
  balance: number;
}

interface BSSection {
  title: string;
  items: AccountBalance[];
  total: number;
}

// GET: 貸借対照表データを取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

    // 指定日までの全仕訳を取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { lte: new Date(endDate) },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    // 勘定科目別に残高を計算
    const balances = new Map<string, { account: typeof journals[0]["debitAccount"]; balance: number }>();

    for (const journal of journals) {
      // 借方（増加）
      const debitKey = journal.debitAccountId;
      const debitCurrent = balances.get(debitKey) || { account: journal.debitAccount, balance: 0 };

      // 資産・費用は借方で増加、負債・純資産・収益は借方で減少
      if (journal.debitAccount.type === "ASSET" || journal.debitAccount.type === "EXPENSE") {
        debitCurrent.balance += journal.amount;
      } else {
        debitCurrent.balance -= journal.amount;
      }
      balances.set(debitKey, debitCurrent);

      // 貸方（減少）
      const creditKey = journal.creditAccountId;
      const creditCurrent = balances.get(creditKey) || { account: journal.creditAccount, balance: 0 };

      // 資産・費用は貸方で減少、負債・純資産・収益は貸方で増加
      if (journal.creditAccount.type === "ASSET" || journal.creditAccount.type === "EXPENSE") {
        creditCurrent.balance -= journal.amount;
      } else {
        creditCurrent.balance += journal.amount;
      }
      balances.set(creditKey, creditCurrent);
    }

    // 損益計算（収益 - 費用 = 当期純利益）
    let netIncome = 0;
    for (const [, data] of balances) {
      if (data.account.type === "REVENUE") {
        netIncome += data.balance;
      } else if (data.account.type === "EXPENSE") {
        netIncome -= data.balance;
      }
    }

    // カテゴリ別に分類
    const assets: AccountBalance[] = [];
    const liabilities: AccountBalance[] = [];
    const equity: AccountBalance[] = [];

    for (const [, data] of balances) {
      if (data.balance === 0) continue;

      const item: AccountBalance = {
        code: data.account.code,
        name: data.account.name,
        category: data.account.category,
        balance: Math.abs(data.balance),
      };

      if (data.account.type === "ASSET") {
        assets.push(item);
      } else if (data.account.type === "LIABILITY") {
        liabilities.push(item);
      } else if (data.account.type === "EQUITY") {
        equity.push(item);
      }
    }

    // コード順にソート
    assets.sort((a, b) => a.code.localeCompare(b.code));
    liabilities.sort((a, b) => a.code.localeCompare(b.code));
    equity.sort((a, b) => a.code.localeCompare(b.code));

    // 当期純利益を純資産に追加
    if (netIncome !== 0) {
      equity.push({
        code: "399",
        name: "当期純利益",
        category: "利益剰余金",
        balance: netIncome,
      });
    }

    // カテゴリ別に集計
    const groupByCategory = (items: AccountBalance[]): BSSection[] => {
      const categories = new Map<string, AccountBalance[]>();
      for (const item of items) {
        const list = categories.get(item.category) || [];
        list.push(item);
        categories.set(item.category, list);
      }
      return Array.from(categories.entries()).map(([title, items]) => ({
        title,
        items,
        total: items.reduce((sum, item) => sum + item.balance, 0),
      }));
    };

    const assetSections = groupByCategory(assets);
    const liabilitySections = groupByCategory(liabilities);
    const equitySections = groupByCategory(equity);

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return NextResponse.json({
      date: endDate,
      assets: {
        sections: assetSections,
        total: totalAssets,
      },
      liabilities: {
        sections: liabilitySections,
        total: totalLiabilities,
      },
      equity: {
        sections: equitySections,
        total: totalEquity,
      },
      isBalanced: totalAssets === totalLiabilities + totalEquity,
      balanceCheck: {
        assets: totalAssets,
        liabilitiesAndEquity: totalLiabilities + totalEquity,
        difference: totalAssets - (totalLiabilities + totalEquity),
      },
    });
  } catch (error) {
    console.error("貸借対照表取得エラー:", error);
    return NextResponse.json(
      { error: "貸借対照表の取得に失敗しました" },
      { status: 500 }
    );
  }
}
