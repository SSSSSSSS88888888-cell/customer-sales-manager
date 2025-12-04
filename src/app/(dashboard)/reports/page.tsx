"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import { CustomerRanking } from "@/components/reports/CustomerRanking";
import { useToast } from "@/hooks/use-toast";
import { Calendar, RefreshCw } from "lucide-react";

interface MonthlyData {
  year: number;
  month: number;
  totalAmount: number;
  prevTotalAmount: number;
  changeRate: number;
  transactionCount: number;
  dailySales: { date: string; amount: number }[];
}

interface YearlyData {
  year: number;
  monthlySales: {
    month: number;
    monthLabel: string;
    amount: number;
    count: number;
  }[];
  yearlyTotal: number;
  transactionCount: number;
}

interface CustomerData {
  year: number;
  month: number | null;
  ranking: {
    rank: number;
    customerId: string | null;
    customerName: string;
    totalAmount: number;
    transactionCount: number;
  }[];
  noCustomerSales: {
    totalAmount: number;
    transactionCount: number;
  };
}

export default function ReportsPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [isLoadingYearly, setIsLoadingYearly] = useState(true);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const { toast } = useToast();

  // 年の選択肢を生成（過去5年〜今年）
  const years = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fetchMonthlyData = useCallback(async () => {
    setIsLoadingMonthly(true);
    try {
      const response = await fetch(
        `/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`
      );
      if (!response.ok) throw new Error("データの取得に失敗しました");
      const data = await response.json();
      setMonthlyData(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "データの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [selectedYear, selectedMonth, toast]);

  const fetchYearlyData = useCallback(async () => {
    setIsLoadingYearly(true);
    try {
      const response = await fetch(`/api/reports/yearly?year=${selectedYear}`);
      if (!response.ok) throw new Error("データの取得に失敗しました");
      const data = await response.json();
      setYearlyData(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "データの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingYearly(false);
    }
  }, [selectedYear, toast]);

  const fetchCustomerData = useCallback(async () => {
    setIsLoadingCustomer(true);
    try {
      const response = await fetch(
        `/api/reports/customers?year=${selectedYear}&month=${selectedMonth}`
      );
      if (!response.ok) throw new Error("データの取得に失敗しました");
      const data = await response.json();
      setCustomerData(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "データの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [selectedYear, selectedMonth, toast]);

  const fetchAllData = useCallback(() => {
    fetchMonthlyData();
    fetchYearlyData();
    fetchCustomerData();
  }, [fetchMonthlyData, fetchYearlyData, fetchCustomerData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            月次売上レポート
          </h2>
          <p className="text-slate-600">売上データの分析・可視化</p>
        </div>
        <Button variant="outline" onClick={fetchAllData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      {/* 月選択 */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <span className="font-medium text-slate-700">期間選択</span>
        </div>
        <div className="flex gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">年</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">月</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      <SummaryCards
        totalAmount={monthlyData?.totalAmount || 0}
        changeRate={monthlyData?.changeRate || 0}
        transactionCount={monthlyData?.transactionCount || 0}
        isLoading={isLoadingMonthly}
      />

      {/* 月別売上推移グラフ */}
      <MonthlyChart
        data={yearlyData?.monthlySales || []}
        year={selectedYear}
        isLoading={isLoadingYearly}
      />

      {/* 顧客別売上ランキング */}
      <CustomerRanking
        data={customerData?.ranking || []}
        noCustomerSales={customerData?.noCustomerSales}
        isLoading={isLoadingCustomer}
      />
    </div>
  );
}
