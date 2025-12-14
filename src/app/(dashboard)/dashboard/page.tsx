import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calculator,
  BookOpen,
  FileText,
  TrendingUp,
  ArrowRight,
  Banknote,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "おはようございます";
  } else if (hour >= 12 && hour < 18) {
    return "こんにちは";
  } else {
    return "こんばんは";
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "ゲスト";

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // データ取得
  const [accountCount, journalCount, journalData, recentJournals] = await Promise.all([
    // 勘定科目数
    prisma.chartOfAccount.count({ where: { userId } }),
    // 仕訳件数
    prisma.journal.count({ where: { userId } }),
    // 今年度の仕訳合計
    prisma.journal.aggregate({
      where: {
        userId,
        date: { gte: startOfYear },
      },
      _sum: { amount: true },
      _count: true,
    }),
    // 直近の仕訳5件
    prisma.journal.findMany({
      where: { userId },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const totalAmount = Number(journalData._sum.amount || 0);
  const yearlyJournalCount = journalData._count;
  const greeting = getGreeting();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* ウェルカムメッセージ */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-8 w-8" />
          <h2 className="text-2xl font-bold">
            {greeting}、{userName}さん
          </h2>
        </div>
        <p className="text-red-100">
          ZaimuAI - {now.getFullYear()}年度の財務状況をご確認ください
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">仕訳件数</p>
                <p className="text-2xl font-bold">{journalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">勘定科目数</p>
                <p className="text-2xl font-bold">{accountCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">今年度取引額</p>
                <p className="text-2xl font-bold">¥{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">今年度仕訳数</p>
                <p className="text-2xl font-bold">{yearlyJournalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 直近の仕訳 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">直近の仕訳</CardTitle>
            <Link
              href="/journals"
              className="text-sm text-red-600 hover:underline flex items-center gap-1"
            >
              すべて表示 <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentJournals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>仕訳がありません</p>
                <Link
                  href="/journals"
                  className="text-red-600 hover:underline text-sm"
                >
                  最初の仕訳を登録する
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJournals.map((journal) => (
                  <div
                    key={journal.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">
                          {formatDate(journal.date)}
                        </span>
                        <span className="font-medium">
                          {journal.debitAccount.name}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-medium">
                          {journal.creditAccount.name}
                        </span>
                      </div>
                      {journal.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {journal.description}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-medium">
                      ¥{formatCurrency(journal.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* クイックアクセス */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">財務諸表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/statements/bs">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">貸借対照表（B/S）</p>
                    <p className="text-sm text-blue-600">資産・負債・純資産</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-400" />
              </div>
            </Link>

            <Link href="/statements/pl">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">損益計算書（P/L）</p>
                    <p className="text-sm text-green-600">収益・費用・利益</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-green-400" />
              </div>
            </Link>

            <Link href="/statements/cf">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">キャッシュフロー（C/F）</p>
                    <p className="text-sm text-purple-600">現金の流れ</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
