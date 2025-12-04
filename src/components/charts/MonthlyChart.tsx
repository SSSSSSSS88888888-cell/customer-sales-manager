"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
  month: number;
  monthLabel: string;
  amount: number;
  count: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  year: number;
  isLoading?: boolean;
}

// 金額をフォーマット（¥1,234,567形式）
const formatAmount = (amount: number) => {
  if (amount >= 1000000) {
    return `¥${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `¥${(amount / 1000).toFixed(0)}K`;
  }
  return `¥${amount.toLocaleString("ja-JP")}`;
};

const formatTooltipAmount = (amount: number) => {
  return `¥${amount.toLocaleString("ja-JP")}`;
};

export function MonthlyChart({ data, year, isLoading }: MonthlyChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>月別売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-slate-400">読み込み中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{year}年 月別売上推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tickFormatter={formatAmount}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <Tooltip
                formatter={(value: number) => [formatTooltipAmount(value), "売上"]}
                labelFormatter={(label) => `${year}年${label}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="amount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
