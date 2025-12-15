"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calculator,
  Download,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface TaxSummary {
  period: string;
  salesTotal: number;
  salesTax: number;
  purchasesTotal: number;
  purchasesTax: number;
  taxPayable: number;
}

interface AccountItem {
  code: string;
  name: string;
  amount: number;
}

interface TaxData {
  year: number;
  taxRate: number;
  monthlyTax: TaxSummary[];
  yearlyTotal: {
    salesTotal: number;
    salesTax: number;
    purchasesTotal: number;
    purchasesTax: number;
    taxPayable: number;
  };
  incomeStatement: {
    revenue: AccountItem[];
    expenses: AccountItem[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  accountSummary: Array<{
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
}

export default function TaxPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [taxRate, setTaxRate] = useState("10");
  const [data, setData] = useState<TaxData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    // ローカルストレージから同意状態を確認
    const agreed = localStorage.getItem("tax_disclaimer_agreed");
    if (agreed === "true") {
      setHasAgreed(true);
      setShowDisclaimer(false);
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (hasAgreed) {
      fetchData();
    }
  }, [year, taxRate, hasAgreed]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tax?year=${year}&taxRate=${taxRate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("税務データ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgree = () => {
    if (agreedToTerms) {
      localStorage.setItem("tax_disclaimer_agreed", "true");
      setHasAgreed(true);
      setShowDisclaimer(false);
      fetchData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportCSV = (type: "tax" | "income") => {
    if (!data) return;

    let csv = "";
    let filename = "";

    if (type === "tax") {
      csv = "期間,売上高,売上にかかる消費税,仕入高,仕入にかかる消費税,納付税額\n";
      data.monthlyTax.forEach(m => {
        csv += `${m.period},${m.salesTotal},${m.salesTax},${m.purchasesTotal},${m.purchasesTax},${m.taxPayable}\n`;
      });
      csv += `年間合計,${data.yearlyTotal.salesTotal},${data.yearlyTotal.salesTax},${data.yearlyTotal.purchasesTotal},${data.yearlyTotal.purchasesTax},${data.yearlyTotal.taxPayable}\n`;
      filename = `消費税計算_${year}年.csv`;
    } else {
      csv = "区分,勘定科目コード,勘定科目名,金額\n";
      data.incomeStatement.revenue.forEach(r => {
        csv += `収益,${r.code},${r.name},${r.amount}\n`;
      });
      csv += `収益合計,,,${data.incomeStatement.totalRevenue}\n`;
      data.incomeStatement.expenses.forEach(e => {
        csv += `費用,${e.code},${e.name},${e.amount}\n`;
      });
      csv += `費用合計,,,${data.incomeStatement.totalExpenses}\n`;
      csv += `当期純利益,,,${data.incomeStatement.netIncome}\n`;
      filename = `収支計算書_${year}年.csv`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 免責同意書ダイアログ
  if (showDisclaimer) {
    return (
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-amber-600" />
              税務サポート機能 ご利用規約・免責事項
            </DialogTitle>
            <DialogDescription className="text-left">
              本機能をご利用いただく前に、以下の内容をよくお読みいただき、同意の上でご利用ください。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">重要なお知らせ</p>
                  <p className="text-amber-700 mt-1">
                    本機能は税務申告の参考情報を提供するものであり、税理士や税務専門家による助言に代わるものではありません。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">1. サービスの性質</h3>
              <p className="text-slate-600">
                本税務サポート機能（以下「本機能」）は、ユーザーが入力した会計データに基づき、消費税の概算計算および確定申告用の参考データを提供するものです。本機能は情報提供のみを目的としており、税務・会計・法律に関する専門的な助言ではありません。
              </p>

              <h3 className="font-bold text-slate-900">2. 免責事項</h3>
              <ul className="text-slate-600 space-y-2 list-disc pl-5">
                <li>本機能で提供される計算結果や情報の正確性、完全性、最新性について、当社は一切保証いたしません。</li>
                <li>本機能の利用により生じた損害（税務上の不利益、追徴課税、延滞税、加算税等を含むがこれに限らない）について、当社は一切の責任を負いません。</li>
                <li>税制改正等により、本機能の計算ロジックが最新の法令に適合しない場合があります。</li>
              </ul>

              <h3 className="font-bold text-slate-900">3. ユーザーの責任</h3>
              <ul className="text-slate-600 space-y-2 list-disc pl-5">
                <li>税務申告に関する最終的な判断および責任は、すべてユーザーに帰属します。</li>
                <li>実際の税務申告を行う際は、必ず税理士等の専門家にご相談いただくか、税務署にお問い合わせください。</li>
                <li>入力データの正確性はユーザーの責任において管理してください。</li>
              </ul>

              <h3 className="font-bold text-slate-900">4. 推奨事項</h3>
              <ul className="text-slate-600 space-y-2 list-disc pl-5">
                <li>重要な税務判断を行う前に、必ず税理士等の専門家にご相談ください。</li>
                <li>本機能で出力されたデータは、あくまで参考資料としてご利用ください。</li>
                <li>定期的に税務署や税理士と連携し、正確な申告を行ってください。</li>
              </ul>

              <h3 className="font-bold text-slate-900">5. 適用法令</h3>
              <p className="text-slate-600">
                本規約は日本法に準拠し、本機能の利用に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  上記の利用規約・免責事項に同意します
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAgree}
              disabled={!agreedToTerms}
              className="bg-amber-600 hover:bg-amber-700"
            >
              同意して利用開始
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Calculator className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">税務サポート</h1>
            <p className="text-sm text-slate-500">消費税計算・確定申告用データ</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={taxRate} onValueChange={setTaxRate}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">税率10%</SelectItem>
              <SelectItem value="8">税率8%</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      {/* 注意書き */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">ご注意</p>
            <p>本機能で提供される情報は参考値です。実際の税務申告には、税理士等の専門家にご相談ください。</p>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* 年間サマリー */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">年間売上高</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(data.yearlyTotal.salesTotal)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  消費税: {formatCurrency(data.yearlyTotal.salesTax)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">年間仕入・経費</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(data.yearlyTotal.purchasesTotal)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  消費税: {formatCurrency(data.yearlyTotal.purchasesTax)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">消費税納付額（概算）</p>
                <p className={`text-2xl font-bold ${data.yearlyTotal.taxPayable >= 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(data.yearlyTotal.taxPayable)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  売上税 - 仕入税
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">当期純利益</p>
                <p className={`text-2xl font-bold ${data.incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(data.incomeStatement.netIncome)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  収益 - 費用
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 消費税計算表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">消費税計算表（月次）</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV("tax")}>
                  <Download className="h-4 w-4 mr-2" />
                  CSVダウンロード
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-slate-700">期間</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-700">売上高</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-700">売上消費税</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-700">仕入・経費</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-700">仕入消費税</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-700">納付税額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyTax.map((m, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-2">{m.period}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(m.salesTotal)}</td>
                        <td className="py-3 px-2 text-right text-blue-600">{formatCurrency(m.salesTax)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(m.purchasesTotal)}</td>
                        <td className="py-3 px-2 text-right text-red-600">{formatCurrency(m.purchasesTax)}</td>
                        <td className={`py-3 px-2 text-right font-medium ${m.taxPayable >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(m.taxPayable)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="py-3 px-2">年間合計</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(data.yearlyTotal.salesTotal)}</td>
                      <td className="py-3 px-2 text-right text-blue-600">{formatCurrency(data.yearlyTotal.salesTax)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(data.yearlyTotal.purchasesTotal)}</td>
                      <td className="py-3 px-2 text-right text-red-600">{formatCurrency(data.yearlyTotal.purchasesTax)}</td>
                      <td className={`py-3 px-2 text-right ${data.yearlyTotal.taxPayable >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(data.yearlyTotal.taxPayable)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 収支計算書 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  収支計算書（確定申告用参考データ）
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV("income")}>
                  <Download className="h-4 w-4 mr-2" />
                  CSVダウンロード
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 収益 */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b">収益の部</h3>
                  <div className="space-y-2">
                    {data.incomeStatement.revenue.map((r, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{r.code} {r.name}</span>
                        <span className="text-slate-900">{formatCurrency(r.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>収益合計</span>
                      <span className="text-blue-600">{formatCurrency(data.incomeStatement.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* 費用 */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b">費用の部</h3>
                  <div className="space-y-2">
                    {data.incomeStatement.expenses.map((e, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{e.code} {e.name}</span>
                        <span className="text-slate-900">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>費用合計</span>
                      <span className="text-red-600">{formatCurrency(data.incomeStatement.totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 当期純利益 */}
              <div className="mt-6 pt-4 border-t-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">当期純利益（税引前）</span>
                  <span className={`text-2xl font-bold ${data.incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.incomeStatement.netIncome)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
