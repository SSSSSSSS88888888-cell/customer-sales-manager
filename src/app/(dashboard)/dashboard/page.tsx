import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, ShoppingCart, Banknote } from "lucide-react";
import Link from "next/link";

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

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [customerCount, salesData, recentSales, recentCustomers] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.sale.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { userId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }) as Promise<RecentSale[]>,
    prisma.customer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }) as Promise<RecentCustomer[]>,
  ]);

  const totalRevenue = Number(salesData._sum.amount || 0);
  const totalSales = salesData._count;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          ダッシュボード
        </h2>
        <p className="text-slate-600">
          ビジネスの概要を確認できます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              総顧客数
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{customerCount}</div>
            <Link href="/customers" className="text-xs text-blue-600 hover:underline">
              顧客一覧を見る →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              総売上件数
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalSales}</div>
            <Link href="/sales" className="text-xs text-blue-600 hover:underline">
              売上一覧を見る →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              総売上金額
            </CardTitle>
            <Banknote className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ¥{totalRevenue.toLocaleString()}
            </div>
            <Link href="/reports" className="text-xs text-blue-600 hover:underline">
              レポートを見る →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              平均売上金額
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ¥{totalSales > 0 ? Math.round(totalRevenue / totalSales).toLocaleString() : "0"}
            </div>
            <p className="text-xs text-slate-500">1件あたり</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近のデータ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 最近の売上 */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">最近の売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  売上がまだありません
                </p>
              ) : (
                recentSales.map((sale: RecentSale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{sale.productName}</p>
                      <p className="text-sm text-slate-500">
                        {sale.customer?.name || "顧客未設定"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        ¥{Number(sale.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(sale.saleDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近の顧客 */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">最近の顧客</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCustomers.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  顧客がまだいません
                </p>
              ) : (
                recentCustomers.map((customer: RecentCustomer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      <p className="text-sm text-slate-500">
                        {customer.email || "メールなし"}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
