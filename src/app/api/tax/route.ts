import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface TaxSummary {
  period: string;
  salesTotal: number;
  salesTax: number;
  purchasesTotal: number;
  purchasesTax: number;
  taxPayable: number;
}

interface AccountWithType {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface JournalWithAccounts {
  id: string;
  date: Date;
  amount: number;
  debitAccount: AccountWithType;
  creditAccount: AccountWithType;
}

// GET: 消費税計算・税務データ取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const taxRate = parseInt(searchParams.get("taxRate") || "10");

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // 仕訳データを取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: { date: "asc" },
    });

    // 月別消費税計算
    const monthlyTax: TaxSummary[] = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const monthJournals = journals.filter((j: JournalWithAccounts) => {
        const d = new Date(j.date);
        return d >= monthStart && d <= monthEnd;
      });

      // 売上（REVENUE）の計算
      let salesTotal = 0;
      monthJournals.forEach((j: JournalWithAccounts) => {
        if (j.creditAccount.type === "REVENUE") {
          salesTotal += j.amount;
        }
      });

      // 仕入・費用（EXPENSE）の計算
      let purchasesTotal = 0;
      monthJournals.forEach((j: JournalWithAccounts) => {
        if (j.debitAccount.type === "EXPENSE") {
          purchasesTotal += j.amount;
        }
      });

      // 消費税計算（税込金額から逆算）
      const salesTax = Math.floor(salesTotal * taxRate / (100 + taxRate));
      const purchasesTax = Math.floor(purchasesTotal * taxRate / (100 + taxRate));
      const taxPayable = salesTax - purchasesTax;

      monthlyTax.push({
        period: `${year}年${month + 1}月`,
        salesTotal,
        salesTax,
        purchasesTotal,
        purchasesTax,
        taxPayable,
      });
    }

    // 年間合計
    const yearlyTotal = monthlyTax.reduce(
      (acc, m) => ({
        salesTotal: acc.salesTotal + m.salesTotal,
        salesTax: acc.salesTax + m.salesTax,
        purchasesTotal: acc.purchasesTotal + m.purchasesTotal,
        purchasesTax: acc.purchasesTax + m.purchasesTax,
        taxPayable: acc.taxPayable + m.taxPayable,
      }),
      { salesTotal: 0, salesTax: 0, purchasesTotal: 0, purchasesTax: 0, taxPayable: 0 }
    );

    // 確定申告用データ（勘定科目別集計）
    const accountSummary: Record<string, { name: string; type: string; debit: number; credit: number }> = {};

    journals.forEach((j: JournalWithAccounts) => {
      // 借方
      if (!accountSummary[j.debitAccount.code]) {
        accountSummary[j.debitAccount.code] = {
          name: j.debitAccount.name,
          type: j.debitAccount.type,
          debit: 0,
          credit: 0,
        };
      }
      accountSummary[j.debitAccount.code].debit += j.amount;

      // 貸方
      if (!accountSummary[j.creditAccount.code]) {
        accountSummary[j.creditAccount.code] = {
          name: j.creditAccount.name,
          type: j.creditAccount.type,
          debit: 0,
          credit: 0,
        };
      }
      accountSummary[j.creditAccount.code].credit += j.amount;
    });

    // 収支計算書データ
    const incomeStatement = {
      revenue: Object.entries(accountSummary)
        .filter(([, v]) => v.type === "REVENUE")
        .map(([code, v]) => ({ code, name: v.name, amount: v.credit })),
      expenses: Object.entries(accountSummary)
        .filter(([, v]) => v.type === "EXPENSE")
        .map(([code, v]) => ({ code, name: v.name, amount: v.debit })),
    };

    const totalRevenue = incomeStatement.revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = incomeStatement.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return NextResponse.json({
      year,
      taxRate,
      monthlyTax,
      yearlyTotal,
      incomeStatement: {
        ...incomeStatement,
        totalRevenue,
        totalExpenses,
        netIncome,
      },
      accountSummary: Object.entries(accountSummary).map(([code, v]) => ({
        code,
        ...v,
        balance: v.debit - v.credit,
      })),
    });
  } catch (error) {
    console.error("税務データ取得エラー:", error);
    return NextResponse.json(
      { error: "税務データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
