import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [customerCount, salesData, recentSales] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.sale.aggregate({
      where: { userId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { userId },
      include: { customer: true },
      orderBy: { saleDate: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(salesData._sum.amount || 0);
  const totalSales = salesData._count;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Overview of your business performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Sale
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No sales yet
              </p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{sale.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.description || "No description"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${Number(sale.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
