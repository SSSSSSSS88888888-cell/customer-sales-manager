"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Download, TrendingUp, TrendingDown, FileSpreadsheet } from "lucide-react";
import { exportPLToPDF, exportPLToExcel } from "@/lib/export";

interface PLData {
  period: { startDate: string; endDate: string };
  revenues: { sections: { title: string; items: { code: string; name: string; amount: number }[]; total: number }[]; total: number };
  expenses: { sections: { title: string; items: { code: string; name: string; amount: number }[]; total: number }[]; total: number };
  summary: {
    sales: number;
    costOfSales: number;
    grossProfit: number;
    sgaExpenses: number;
    operatingIncome: number;
    nonOperatingRevenue: number;
    nonOperatingExpenses: number;
    ordinaryIncome: number;
    extraordinaryGains: number;
    extraordinaryLosses: number;
    incomeBeforeTax: number;
    taxes: number;
    netIncome: number;
  };
}

export default function ProfitLossPage() {
  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/statements/pl?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error("損益計算書取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <PieChart className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">損益計算書</h1>
            <p className="text-sm text-slate-500">Profit and Loss Statement (P/L)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm whitespace-nowrap">
              期間:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <span className="text-slate-400">〜</span>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => data && exportPLToPDF(data)}
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            PDF出力
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => data && exportPLToExcel(data)}
            disabled={!data}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel出力
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 損益計算書本体 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-green-900">損益計算書</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* 売上高 */}
              <div className="border-b">
                <div className="px-4 py-3 bg-slate-50 font-medium text-slate-700">
                  売上高
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="pl-4">売上高</span>
                  <span className="font-mono">{formatCurrency(summary?.sales || 0)}</span>
                </div>
              </div>

              {/* 売上原価 */}
              <div className="border-b">
                <div className="px-4 py-3 bg-slate-50 font-medium text-slate-700">
                  売上原価
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="pl-4">売上原価</span>
                  <span className="font-mono">{formatCurrency(summary?.costOfSales || 0)}</span>
                </div>
              </div>

              {/* 売上総利益 */}
              <div className="px-4 py-3 flex justify-between font-bold bg-blue-50 border-b">
                <span>売上総利益</span>
                <span className="font-mono">{formatCurrency(summary?.grossProfit || 0)}</span>
              </div>

              {/* 販管費 */}
              <div className="border-b">
                <div className="px-4 py-3 bg-slate-50 font-medium text-slate-700">
                  販売費及び一般管理費
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="pl-4">販管費合計</span>
                  <span className="font-mono">{formatCurrency(summary?.sgaExpenses || 0)}</span>
                </div>
              </div>

              {/* 営業利益 */}
              <div className="px-4 py-3 flex justify-between font-bold bg-green-50 border-b">
                <span>営業利益</span>
                <span className="font-mono">{formatCurrency(summary?.operatingIncome || 0)}</span>
              </div>

              {/* 営業外損益 */}
              <div className="border-b">
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span>営業外収益</span>
                  <span className="font-mono">{formatCurrency(summary?.nonOperatingRevenue || 0)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span>営業外費用</span>
                  <span className="font-mono">{formatCurrency(summary?.nonOperatingExpenses || 0)}</span>
                </div>
              </div>

              {/* 経常利益 */}
              <div className="px-4 py-3 flex justify-between font-bold bg-green-100 border-b">
                <span>経常利益</span>
                <span className="font-mono">{formatCurrency(summary?.ordinaryIncome || 0)}</span>
              </div>

              {/* 特別損益 */}
              <div className="border-b">
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span>特別利益</span>
                  <span className="font-mono">{formatCurrency(summary?.extraordinaryGains || 0)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span>特別損失</span>
                  <span className="font-mono">{formatCurrency(summary?.extraordinaryLosses || 0)}</span>
                </div>
              </div>

              {/* 税引前当期純利益 */}
              <div className="px-4 py-3 flex justify-between font-medium bg-slate-50 border-b">
                <span>税引前当期純利益</span>
                <span className="font-mono">{formatCurrency(summary?.incomeBeforeTax || 0)}</span>
              </div>

              {/* 法人税等 */}
              <div className="px-4 py-2 flex justify-between border-b">
                <span>法人税等</span>
                <span className="font-mono">{formatCurrency(summary?.taxes || 0)}</span>
              </div>

              {/* 当期純利益 */}
              <div
                className={`px-4 py-4 flex justify-between font-bold text-lg ${
                  (summary?.netIncome || 0) >= 0
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                <span>当期純利益</span>
                <span className="font-mono">{formatCurrency(summary?.netIncome || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* サマリーカード */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">収益性サマリー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">売上高</span>
                <span className="font-mono font-bold">
                  {formatCurrency(summary?.sales || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">売上総利益率</span>
                <span className="font-mono font-bold">
                  {summary?.sales
                    ? ((summary.grossProfit / summary.sales) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">営業利益率</span>
                <span className="font-mono font-bold">
                  {summary?.sales
                    ? ((summary.operatingIncome / summary.sales) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">経常利益率</span>
                <span className="font-mono font-bold">
                  {summary?.sales
                    ? ((summary.ordinaryIncome / summary.sales) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              (summary?.netIncome || 0) >= 0 ? "bg-green-50" : "bg-red-50"
            }
          >
            <CardContent className="py-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {(summary?.netIncome || 0) >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      (summary?.netIncome || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(summary?.netIncome || 0) >= 0 ? "黒字" : "赤字"}
                  </span>
                </div>
                <div
                  className={`text-3xl font-bold ${
                    (summary?.netIncome || 0) >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  ¥{formatCurrency(summary?.netIncome || 0)}
                </div>
                <div className="text-sm text-slate-500 mt-1">当期純利益</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
