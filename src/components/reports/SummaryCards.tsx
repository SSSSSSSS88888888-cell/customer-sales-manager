"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Banknote, FileText } from "lucide-react";

interface SummaryCardsProps {
  totalAmount: number;
  changeRate: number;
  transactionCount: number;
  isLoading?: boolean;
}

// 金額をフォーマット（¥1,234,567形式）
const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString("ja-JP")}`;
};

export function SummaryCards({
  totalAmount,
  changeRate,
  transactionCount,
  isLoading,
}: SummaryCardsProps) {
  const getTrendIcon = () => {
    if (changeRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (changeRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (changeRate > 0) return "text-green-600";
    if (changeRate < 0) return "text-red-600";
    return "text-slate-500";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 今月の売上合計 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            今月の売上合計
          </CardTitle>
          <Banknote className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatAmount(totalAmount)}
          </div>
        </CardContent>
      </Card>

      {/* 先月比 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            先月比
          </CardTitle>
          {getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getTrendColor()}`}>
            {changeRate > 0 ? "+" : ""}
            {changeRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            前月からの増減率
          </p>
        </CardContent>
      </Card>

      {/* 今月の取引件数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            今月の取引件数
          </CardTitle>
          <FileText className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {transactionCount}件
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
