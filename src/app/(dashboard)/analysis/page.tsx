"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
} from "lucide-react";

interface FinancialRatio {
  name: string;
  value: number | null;
  unit: string;
  benchmark: number;
  benchmarkLabel: string;
  isHigherBetter: boolean;
  category: string;
}

interface AnalysisData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
    sales: number;
    grossProfit: number;
    operatingIncome: number;
    netIncome: number;
  };
  ratios: FinancialRatio[];
}

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const res = await fetch("/api/analysis");
      const result = await res.json();
      if (res.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("分析データ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return "-";
    if (unit === "回") {
      return value.toFixed(2);
    }
    return value.toFixed(1);
  };

  const getStatusColor = (ratio: FinancialRatio) => {
    if (ratio.value === null) return "bg-slate-100 text-slate-600";
    const meetsBenchmark = ratio.isHigherBetter
      ? ratio.value >= ratio.benchmark
      : ratio.value <= ratio.benchmark;
    return meetsBenchmark
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  const getStatusIcon = (ratio: FinancialRatio) => {
    if (ratio.value === null) return <Minus className="h-4 w-4" />;
    const meetsBenchmark = ratio.isHigherBetter
      ? ratio.value >= ratio.benchmark
      : ratio.value <= ratio.benchmark;
    return meetsBenchmark ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : (
      <ArrowDownRight className="h-4 w-4" />
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "安全性":
        return <Shield className="h-5 w-5" />;
      case "収益性":
        return <TrendingUp className="h-5 w-5" />;
      case "効率性":
        return <Zap className="h-5 w-5" />;
      default:
        return <Calculator className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "安全性":
        return "bg-blue-100 text-blue-600";
      case "収益性":
        return "bg-green-100 text-green-600";
      case "効率性":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const groupedRatios = data?.ratios.reduce((acc, ratio) => {
    if (!acc[ratio.category]) {
      acc[ratio.category] = [];
    }
    acc[ratio.category].push(ratio);
    return acc;
  }, {} as Record<string, FinancialRatio[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <Calculator className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">財務分析</h1>
          <p className="text-sm text-slate-500">
            {data?.period.startDate} 〜 {data?.period.endDate} の財務指標
          </p>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">総資産</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.totalAssets || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">売上高</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.sales || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">営業利益</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.operatingIncome || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">自己資本</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.equity || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 財務指標 */}
      {Object.entries(groupedRatios).map(([category, ratios]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(
                  category
                )}`}
              >
                {getCategoryIcon(category)}
              </div>
              <CardTitle className="text-lg">{category}指標</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {ratios.map((ratio) => (
                <div
                  key={ratio.name}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">
                      {ratio.name}
                    </p>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ratio
                      )}`}
                    >
                      {getStatusIcon(ratio)}
                      {ratio.value !== null &&
                        (ratio.isHigherBetter
                          ? ratio.value >= ratio.benchmark
                            ? "良好"
                            : "要改善"
                          : ratio.value <= ratio.benchmark
                          ? "良好"
                          : "要改善")}
                      {ratio.value === null && "データ不足"}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {formatValue(ratio.value, ratio.unit)}
                    <span className="text-lg font-normal text-slate-500 ml-1">
                      {ratio.unit}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{ratio.benchmarkLabel}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* データがない場合 */}
      {(!data?.ratios || data.ratios.length === 0) && (
        <Card className="border-slate-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Calculator className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">財務データがありません</p>
              <p className="text-sm text-slate-500">
                仕訳を登録すると、財務指標が自動計算されます
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 凡例 */}
      <Card className="bg-slate-50">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-slate-600">基準値を満たしている</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-slate-600">基準値を下回っている</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full" />
              <span className="text-slate-600">データ不足</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
