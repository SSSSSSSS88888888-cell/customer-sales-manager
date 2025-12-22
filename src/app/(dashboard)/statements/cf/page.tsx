"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Download, ArrowUp, ArrowDown, Minus, FileSpreadsheet } from "lucide-react";
import { exportCFToPDF, exportCFToExcel } from "@/lib/export";

interface CashFlowItem {
  description: string;
  amount: number;
}

interface CFData {
  period: { startDate: string; endDate: string };
  operating: { items: CashFlowItem[]; total: number };
  investing: { items: CashFlowItem[]; total: number };
  financing: { items: CashFlowItem[]; total: number };
  summary: {
    operatingTotal: number;
    investingTotal: number;
    financingTotal: number;
    netChange: number;
    beginningBalance: number;
    endingBalance: number;
  };
}

export default function CashFlowPage() {
  const [data, setData] = useState<CFData | null>(null);
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
        `/api/statements/cf?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error("キャッシュフロー計算書取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  const AmountDisplay = ({ amount }: { amount: number }) => {
    if (amount > 0) {
      return (
        <span className="font-mono text-black flex items-center gap-1">
          <ArrowUp className="h-3 w-3" />
          {formatCurrency(amount)}
        </span>
      );
    } else if (amount < 0) {
      return (
        <span className="font-mono text-red-600 flex items-center gap-1">
          <ArrowDown className="h-3 w-3" />
          {formatCurrency(Math.abs(amount))}
        </span>
      );
    }
    return (
      <span className="font-mono text-slate-400 flex items-center gap-1">
        <Minus className="h-3 w-3" />0
      </span>
    );
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
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">キャッシュフロー計算書</h1>
            <p className="text-sm text-slate-500">Cash Flow Statement (C/F)</p>
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
            onClick={() => {
              if (data) {
                const exportData = {
                  period: data.period,
                  operating: {
                    items: data.operating.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.operatingTotal,
                  },
                  investing: {
                    items: data.investing.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.investingTotal,
                  },
                  financing: {
                    items: data.financing.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.financingTotal,
                  },
                  summary: {
                    netCashFlow: data.summary.netChange,
                    beginningCash: data.summary.beginningBalance,
                    endingCash: data.summary.endingBalance,
                  },
                };
                exportCFToPDF(exportData);
              }
            }}
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            PDF出力
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (data) {
                const exportData = {
                  period: data.period,
                  operating: {
                    items: data.operating.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.operatingTotal,
                  },
                  investing: {
                    items: data.investing.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.investingTotal,
                  },
                  financing: {
                    items: data.financing.items.map(i => ({ name: i.description, amount: i.amount })),
                    total: data.summary.financingTotal,
                  },
                  summary: {
                    netCashFlow: data.summary.netChange,
                    beginningCash: data.summary.beginningBalance,
                    endingCash: data.summary.endingBalance,
                  },
                };
                exportCFToExcel(exportData);
              }
            }}
            disabled={!data}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel出力
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* キャッシュフロー計算書本体 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 営業活動によるキャッシュフロー */}
          <Card>
            <CardHeader className="bg-black/5 border-b">
              <CardTitle className="text-black">
                I. 営業活動によるキャッシュフロー
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.operating.items.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-2 flex justify-between border-b last:border-b-0"
                >
                  <span className="text-sm">{item.description}</span>
                  <AmountDisplay amount={item.amount} />
                </div>
              ))}
              {data?.operating.items.length === 0 && (
                <div className="px-4 py-3 text-black/40 text-sm">取引なし</div>
              )}
              <div className="px-4 py-3 flex justify-between font-bold bg-black/10 text-black">
                <span>営業活動によるキャッシュフロー</span>
                <AmountDisplay amount={summary?.operatingTotal || 0} />
              </div>
            </CardContent>
          </Card>

          {/* 投資活動によるキャッシュフロー */}
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-900">
                II. 投資活動によるキャッシュフロー
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.investing.items.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-2 flex justify-between border-b last:border-b-0"
                >
                  <span className="text-sm">{item.description}</span>
                  <AmountDisplay amount={item.amount} />
                </div>
              ))}
              {data?.investing.items.length === 0 && (
                <div className="px-4 py-3 text-black/40 text-sm">取引なし</div>
              )}
              <div className="px-4 py-3 flex justify-between font-bold bg-red-100 text-red-900">
                <span>投資活動によるキャッシュフロー</span>
                <AmountDisplay amount={summary?.investingTotal || 0} />
              </div>
            </CardContent>
          </Card>

          {/* 財務活動によるキャッシュフロー */}
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-900">
                III. 財務活動によるキャッシュフロー
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.financing.items.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-2 flex justify-between border-b last:border-b-0"
                >
                  <span className="text-sm">{item.description}</span>
                  <AmountDisplay amount={item.amount} />
                </div>
              ))}
              {data?.financing.items.length === 0 && (
                <div className="px-4 py-3 text-black/40 text-sm">取引なし</div>
              )}
              <div className="px-4 py-3 flex justify-between font-bold bg-red-100 text-red-900">
                <span>財務活動によるキャッシュフロー</span>
                <AmountDisplay amount={summary?.financingTotal || 0} />
              </div>
            </CardContent>
          </Card>

          {/* 現金の増減 */}
          <Card className="bg-slate-900 text-white">
            <CardContent className="py-4 space-y-3">
              <div className="flex justify-between">
                <span>現金及び現金同等物の増減額</span>
                <span className="font-mono font-bold">
                  {(summary?.netChange || 0) >= 0 ? "+" : ""}
                  {formatCurrency(summary?.netChange || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>期首残高</span>
                <span className="font-mono">
                  {formatCurrency(summary?.beginningBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-3">
                <span>期末残高</span>
                <span className="font-mono">
                  {formatCurrency(summary?.endingBalance || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* サマリーカード */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">キャッシュフローサマリー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                <span className="text-black">営業CF</span>
                <span
                  className={`font-mono font-bold ${
                    (summary?.operatingTotal || 0) >= 0
                      ? "text-black"
                      : "text-red-600"
                  }`}
                >
                  {(summary?.operatingTotal || 0) >= 0 ? "+" : ""}
                  {formatCurrency(summary?.operatingTotal || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">投資CF</span>
                <span
                  className={`font-mono font-bold ${
                    (summary?.investingTotal || 0) >= 0
                      ? "text-black"
                      : "text-red-600"
                  }`}
                >
                  {(summary?.investingTotal || 0) >= 0 ? "+" : ""}
                  {formatCurrency(summary?.investingTotal || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">財務CF</span>
                <span
                  className={`font-mono font-bold ${
                    (summary?.financingTotal || 0) >= 0
                      ? "text-black"
                      : "text-red-600"
                  }`}
                >
                  {(summary?.financingTotal || 0) >= 0 ? "+" : ""}
                  {formatCurrency(summary?.financingTotal || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              (summary?.netChange || 0) >= 0 ? "bg-black/5" : "bg-red-50"
            }
          >
            <CardContent className="py-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {(summary?.netChange || 0) >= 0 ? (
                    <ArrowUp className="h-6 w-6 text-black" />
                  ) : (
                    <ArrowDown className="h-6 w-6 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      (summary?.netChange || 0) >= 0
                        ? "text-black"
                        : "text-red-600"
                    }`}
                  >
                    {(summary?.netChange || 0) >= 0 ? "増加" : "減少"}
                  </span>
                </div>
                <div
                  className={`text-3xl font-bold ${
                    (summary?.netChange || 0) >= 0
                      ? "text-black"
                      : "text-red-700"
                  }`}
                >
                  ¥{formatCurrency(Math.abs(summary?.netChange || 0))}
                </div>
                <div className="text-sm text-black/50 mt-1">現金増減額</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-sm text-slate-500 mb-1">期末現金残高</div>
                <div className="text-3xl font-bold text-slate-900">
                  ¥{formatCurrency(summary?.endingBalance || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
