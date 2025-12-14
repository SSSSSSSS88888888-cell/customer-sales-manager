"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { exportBSToPDF, exportBSToExcel } from "@/lib/export";

interface AccountBalance {
  code: string;
  name: string;
  category: string;
  balance: number;
}

interface BSSection {
  title: string;
  items: AccountBalance[];
  total: number;
}

interface BSData {
  date: string;
  assets: { sections: BSSection[]; total: number };
  liabilities: { sections: BSSection[]; total: number };
  equity: { sections: BSSection[]; total: number };
  isBalanced: boolean;
  balanceCheck: {
    assets: number;
    liabilitiesAndEquity: number;
    difference: number;
  };
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BSData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, [endDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/statements/bs?endDate=${endDate}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error("貸借対照表取得エラー:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">貸借対照表</h1>
            <p className="text-sm text-slate-500">Balance Sheet (B/S)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm whitespace-nowrap">
              基準日:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => data && exportBSToPDF(data)}
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            PDF出力
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => data && exportBSToExcel(data)}
            disabled={!data}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel出力
          </Button>
        </div>
      </div>

      {/* バランスチェック */}
      {data && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            data.isBalanced
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {data.isBalanced ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700">
                貸借が一致しています（資産 = 負債 + 純資産）
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">
                貸借が一致していません（差額: {formatCurrency(data.balanceCheck.difference)}円）
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 資産の部 */}
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-900">資産の部</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.assets.sections.map((section) => (
              <div key={section.title} className="border-b last:border-b-0">
                <div className="px-4 py-2 bg-slate-50 font-medium text-slate-700">
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <div
                    key={item.code}
                    className="px-4 py-2 flex justify-between text-sm"
                  >
                    <span>
                      <span className="text-slate-400 mr-2">{item.code}</span>
                      {item.name}
                    </span>
                    <span className="font-mono">{formatCurrency(item.balance)}</span>
                  </div>
                ))}
                <div className="px-4 py-2 flex justify-between font-medium border-t bg-slate-50">
                  <span>{section.title}計</span>
                  <span className="font-mono">{formatCurrency(section.total)}</span>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 flex justify-between font-bold bg-blue-100 text-blue-900">
              <span>資産合計</span>
              <span className="font-mono">{formatCurrency(data?.assets.total || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 負債・純資産の部 */}
        <div className="space-y-6">
          {/* 負債の部 */}
          <Card>
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-orange-900">負債の部</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.liabilities.sections.map((section) => (
                <div key={section.title} className="border-b last:border-b-0">
                  <div className="px-4 py-2 bg-slate-50 font-medium text-slate-700">
                    {section.title}
                  </div>
                  {section.items.map((item) => (
                    <div
                      key={item.code}
                      className="px-4 py-2 flex justify-between text-sm"
                    >
                      <span>
                        <span className="text-slate-400 mr-2">{item.code}</span>
                        {item.name}
                      </span>
                      <span className="font-mono">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between font-medium border-t bg-slate-50">
                    <span>{section.title}計</span>
                    <span className="font-mono">{formatCurrency(section.total)}</span>
                  </div>
                </div>
              ))}
              {(data?.liabilities.sections.length || 0) === 0 && (
                <div className="px-4 py-3 text-slate-400 text-sm">負債なし</div>
              )}
              <div className="px-4 py-3 flex justify-between font-bold bg-orange-100 text-orange-900">
                <span>負債合計</span>
                <span className="font-mono">{formatCurrency(data?.liabilities.total || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 純資産の部 */}
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-green-900">純資産の部</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.equity.sections.map((section) => (
                <div key={section.title} className="border-b last:border-b-0">
                  <div className="px-4 py-2 bg-slate-50 font-medium text-slate-700">
                    {section.title}
                  </div>
                  {section.items.map((item) => (
                    <div
                      key={item.code}
                      className="px-4 py-2 flex justify-between text-sm"
                    >
                      <span>
                        <span className="text-slate-400 mr-2">{item.code}</span>
                        {item.name}
                      </span>
                      <span className="font-mono">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between font-medium border-t bg-slate-50">
                    <span>{section.title}計</span>
                    <span className="font-mono">{formatCurrency(section.total)}</span>
                  </div>
                </div>
              ))}
              {(data?.equity.sections.length || 0) === 0 && (
                <div className="px-4 py-3 text-slate-400 text-sm">純資産なし</div>
              )}
              <div className="px-4 py-3 flex justify-between font-bold bg-green-100 text-green-900">
                <span>純資産合計</span>
                <span className="font-mono">{formatCurrency(data?.equity.total || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 負債純資産合計 */}
          <Card className="bg-slate-900 text-white">
            <CardContent className="py-4">
              <div className="flex justify-between font-bold text-lg">
                <span>負債・純資産合計</span>
                <span className="font-mono">
                  {formatCurrency((data?.liabilities.total || 0) + (data?.equity.total || 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
