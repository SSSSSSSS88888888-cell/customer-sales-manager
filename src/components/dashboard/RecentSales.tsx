import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight } from "lucide-react";

interface Sale {
  id: string;
  productName: string;
  amount: number;
  saleDate: Date;
  customer: {
    id: string;
    name: string;
  } | null;
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100">
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </div>
          <CardTitle className="text-lg text-slate-900">直近の売上</CardTitle>
        </div>
        <Link href="/sales">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            もっと見る
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">売上がまだありません</p>
              <Link href="/sales">
                <Button variant="outline" size="sm" className="mt-3">
                  売上を追加する
                </Button>
              </Link>
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {sale.productName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {sale.customer?.name || "顧客未設定"}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-slate-900">
                    ¥{Number(sale.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.saleDate).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
