import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Banknote, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { RecentCustomers } from "@/components/dashboard/RecentCustomers";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

interface RecentSale {
  id: string;
  productName: string;
  amount: number;
  saleDate: Date;
  customer: {
    id: string;
    name: string;
  } | null;
}

interface RecentCustomer {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

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

  // 今月の開始日と終了日
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    customerCount,
    monthlySalesData,
    recentSales,
    recentCustomers,
  ] = await Promise.all([
    // 顧客数
    prisma.customer.count({ where: { userId } }),
    // 今月の売上集計
    prisma.sale.aggregate({
      where: {
        userId,
        saleDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    // 直近の売上5件
    prisma.sale.findMany({
      where: { userId },
      include: { customer: true },
      orderBy: { saleDate: "desc" },
      take: 5,
    }) as Promise<RecentSale[]>,
    // 直近の顧客5件
    prisma.customer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }) as Promise<RecentCustomer[]>,
  ]);

  const monthlyRevenue = Number(monthlySalesData._sum.amount || 0);
  const monthlySalesCount = monthlySalesData._count;
  const averageTransaction = monthlySalesCount > 0
    ? Math.round(monthlyRevenue / monthlySalesCount)
    : 0;

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* ウェルカムメッセージ */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">
          {greeting}、{userName}さん
        </h2>
        <p className="text-blue-100 mt-1">
          {now.getFullYear()}年{now.getMonth() + 1}月のビジネス概要をご確認ください
        </p>
      </div>

      {/* 今月のサマリーカード */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          今月のサマリー
        </h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="総売上"
            value={`¥${monthlyRevenue.toLocaleString()}`}
            icon={Banknote}
            description={`${now.getMonth() + 1}月の売上合計`}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <SummaryCard
            title="取引件数"
            value={monthlySalesCount}
            icon={ShoppingCart}
            description={`${now.getMonth() + 1}月の取引数`}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <SummaryCard
            title="顧客数"
            value={customerCount}
            icon={Users}
            description="登録済み顧客"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <SummaryCard
            title="平均取引額"
            value={`¥${averageTransaction.toLocaleString()}`}
            icon={TrendingUp}
            description="1件あたりの金額"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>
      </div>

      {/* 直近のデータ */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <RecentSales sales={recentSales} />
        <RecentCustomers customers={recentCustomers} />
      </div>
    </div>
  );
}
