"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Target,
  ChevronLeft,
  ChevronRight,
  Save,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyBudget {
  month: number;
  monthLabel: string;
  salesBudget: number;
  salesActual: number;
  expensesBudget: number;
  expensesActual: number;
  profitBudget: number;
  profitActual: number;
}

interface BudgetData {
  year: number;
  monthlyData: MonthlyBudget[];
  yearlyTotal: {
    salesBudget: number;
    salesActual: number;
    expensesBudget: number;
    expensesActual: number;
    profitBudget: number;
    profitActual: number;
  };
}

export default function BudgetPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    fetchBudgets();
  }, [year]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets?year=${year}`);
      const result = await res.json();
      if (res.ok) {
        setData(result);
        // 編集用データを初期化
        const edit: Record<string, Record<string, number>> = {};
        for (const m of result.monthlyData) {
          edit[m.month] = {
            sales: m.salesBudget,
            expenses: m.expensesBudget,
          };
        }
        setEditData(edit);
      }
    } catch (error) {
      console.error("予算取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgets = async () => {
    setIsSaving(true);
    try {
      for (const [month, values] of Object.entries(editData)) {
        if (values.sales > 0) {
          await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              year,
              month: parseInt(month),
              category: "sales",
              amount: values.sales,
            }),
          });
        }
        if (values.expenses > 0) {
          await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              year,
              month: parseInt(month),
              category: "expenses",
              amount: values.expenses,
            }),
          });
        }
      }
      await fetchBudgets();
      setEditMode(false);
    } catch (error) {
      console.error("予算保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (actual: number, budget: number, isExpense: boolean = false) => {
    if (budget === 0) return "bg-black/20";
    const ratio = actual / budget;
    if (isExpense) {
      if (ratio > 1) return "bg-red-600";
      if (ratio > 0.8) return "bg-red-400";
      return "bg-black";
    } else {
      if (ratio >= 1) return "bg-black";
      if (ratio >= 0.8) return "bg-red-400";
      return "bg-red-600";
    }
  };

  const getProgressWidth = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // グラフ用データ
  const chartData = data?.monthlyData.map(m => ({
    month: m.monthLabel,
    売上予算: m.salesBudget,
    売上実績: m.salesActual,
    費用予算: m.expensesBudget,
    費用実績: m.expensesActual,
  })) || [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">予算管理</h1>
            <p className="text-sm text-slate-500">年間予算の設定と実績比較</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold px-4">{year}年</span>
          <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 年間サマリー */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">年間売上</p>
                <TrendingUp className="h-4 w-4 text-black" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(data.yearlyTotal.salesActual)}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>予算: {formatCurrency(data.yearlyTotal.salesBudget)}</span>
                  <span>
                    {data.yearlyTotal.salesBudget > 0
                      ? `${((data.yearlyTotal.salesActual / data.yearlyTotal.salesBudget) * 100).toFixed(0)}%`
                      : "-"}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(data.yearlyTotal.salesActual, data.yearlyTotal.salesBudget)}`}
                    style={{ width: `${getProgressWidth(data.yearlyTotal.salesActual, data.yearlyTotal.salesBudget)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">年間費用</p>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(data.yearlyTotal.expensesActual)}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>予算: {formatCurrency(data.yearlyTotal.expensesBudget)}</span>
                  <span>
                    {data.yearlyTotal.expensesBudget > 0
                      ? `${((data.yearlyTotal.expensesActual / data.yearlyTotal.expensesBudget) * 100).toFixed(0)}%`
                      : "-"}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(data.yearlyTotal.expensesActual, data.yearlyTotal.expensesBudget, true)}`}
                    style={{ width: `${getProgressWidth(data.yearlyTotal.expensesActual, data.yearlyTotal.expensesBudget)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">年間利益</p>
                <Target className="h-4 w-4 text-black" />
              </div>
              <p className={`text-2xl font-bold ${data.yearlyTotal.profitActual >= 0 ? 'text-black' : 'text-red-600'}`}>
                {formatCurrency(data.yearlyTotal.profitActual)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                予算: {formatCurrency(data.yearlyTotal.profitBudget)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* グラフ */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">予算vs実績（月次推移）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="売上予算" fill="#1f2937" />
                  <Bar dataKey="売上実績" fill="#000000" />
                  <Bar dataKey="費用予算" fill="#fca5a5" />
                  <Bar dataKey="費用実績" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 月別詳細 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">月別予算設定</CardTitle>
            {editMode ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  キャンセル
                </Button>
                <Button onClick={saveBudgets} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="outline">
                予算を編集
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-slate-700">月</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">売上予算</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">売上実績</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">達成率</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">費用予算</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">費用実績</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-700">消化率</th>
                </tr>
              </thead>
              <tbody>
                {data?.monthlyData.map((m) => (
                  <tr key={m.month} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium">{m.monthLabel}</td>
                    <td className="py-3 px-2 text-right">
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData[m.month]?.sales || 0}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            [m.month]: { ...prev[m.month], sales: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-28 text-right"
                        />
                      ) : (
                        formatCurrency(m.salesBudget)
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-black">{formatCurrency(m.salesActual)}</td>
                    <td className="py-3 px-2 text-right">
                      {m.salesBudget > 0 ? (
                        <span className={m.salesActual >= m.salesBudget ? "text-black" : "text-red-600"}>
                          {((m.salesActual / m.salesBudget) * 100).toFixed(0)}%
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData[m.month]?.expenses || 0}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            [m.month]: { ...prev[m.month], expenses: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-28 text-right"
                        />
                      ) : (
                        formatCurrency(m.expensesBudget)
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-red-600">{formatCurrency(m.expensesActual)}</td>
                    <td className="py-3 px-2 text-right">
                      {m.expensesBudget > 0 ? (
                        <span className={m.expensesActual <= m.expensesBudget ? "text-black" : "text-red-600"}>
                          {((m.expensesActual / m.expensesBudget) * 100).toFixed(0)}%
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
