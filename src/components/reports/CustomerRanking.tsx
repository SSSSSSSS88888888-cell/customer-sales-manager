"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

interface CustomerRankingData {
  rank: number;
  customerId: string | null;
  customerName: string;
  totalAmount: number;
  transactionCount: number;
}

interface CustomerRankingProps {
  data: CustomerRankingData[];
  noCustomerSales?: {
    totalAmount: number;
    transactionCount: number;
  };
  isLoading?: boolean;
}

// 金額をフォーマット（¥1,234,567形式）
const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString("ja-JP")}`;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-slate-500 font-medium">{rank}</span>;
  }
};

export function CustomerRanking({
  data,
  noCustomerSales,
  isLoading,
}: CustomerRankingProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>顧客別売上ランキング</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0 || (noCustomerSales && noCustomerSales.transactionCount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          顧客別売上ランキング（Top 10）
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-slate-500">
            データがありません
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">順位</TableHead>
                  <TableHead>顧客名</TableHead>
                  <TableHead className="text-right">売上合計</TableHead>
                  <TableHead className="text-right">取引件数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.customerId || "no-customer"}>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {getRankIcon(item.rank)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.customerName}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.transactionCount}件
                    </TableCell>
                  </TableRow>
                ))}
                {noCustomerSales && noCustomerSales.transactionCount > 0 && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="text-center">
                      <span className="text-slate-400">-</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-500">
                      顧客未設定
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-500">
                      {formatAmount(noCustomerSales.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {noCustomerSales.transactionCount}件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
