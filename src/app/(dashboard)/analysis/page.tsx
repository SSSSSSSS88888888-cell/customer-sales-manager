"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Loader2,
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

interface AIDiagnosis {
  overallScore: number;
  grade: string;
  summary: string;
  safetyAnalysis?: {
    score: number;
    comment: string;
  };
  profitabilityAnalysis?: {
    score: number;
    comment: string;
  };
  efficiencyAnalysis?: {
    score: number;
    comment: string;
  };
  recommendations: string[];
  risks: string[];
}

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiDiagnosis, setAIDiagnosis] = useState<AIDiagnosis | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

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

  const runAIDiagnosis = async () => {
    setIsAILoading(true);
    setAIError(null);
    try {
      const res = await fetch("/api/ai/diagnose", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setAIDiagnosis(result.diagnosis);
      } else {
        setAIError(result.error || "AI診断に失敗しました");
      }
    } catch (error) {
      console.error("AI診断エラー:", error);
      setAIError("AI診断の実行に失敗しました");
    } finally {
      setIsAILoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S":
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
      case "A":
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white";
      case "B":
        return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
      case "C":
        return "bg-gradient-to-r from-orange-400 to-amber-500 text-white";
      case "D":
        return "bg-gradient-to-r from-red-400 to-rose-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
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
      <div className="flex items-center justify-between">
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
        <Button
          onClick={runAIDiagnosis}
          disabled={isAILoading}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-2"
        >
          {isAILoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI分析中...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              AI財務診断
            </>
          )}
        </Button>
      </div>

      {/* AI診断結果 */}
      {aiError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{aiError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {aiDiagnosis && (
        <Card className="border-purple-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6" />
                <CardTitle className="text-white">AI財務診断レポート</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-purple-200">総合スコア</p>
                  <p className={`text-3xl font-bold ${aiDiagnosis.overallScore >= 60 ? 'text-white' : 'text-yellow-300'}`}>
                    {aiDiagnosis.overallScore}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getGradeColor(aiDiagnosis.grade)}`}>
                  {aiDiagnosis.grade}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* サマリー */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">{aiDiagnosis.summary}</p>
            </div>

            {/* 詳細分析 */}
            <div className="grid gap-4 md:grid-cols-3">
              {aiDiagnosis.safetyAnalysis && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">安全性</h4>
                    <span className={`ml-auto text-xl font-bold ${getScoreColor(aiDiagnosis.safetyAnalysis.score)}`}>
                      {aiDiagnosis.safetyAnalysis.score}点
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">{aiDiagnosis.safetyAnalysis.comment}</p>
                </div>
              )}
              {aiDiagnosis.profitabilityAnalysis && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">収益性</h4>
                    <span className={`ml-auto text-xl font-bold ${getScoreColor(aiDiagnosis.profitabilityAnalysis.score)}`}>
                      {aiDiagnosis.profitabilityAnalysis.score}点
                    </span>
                  </div>
                  <p className="text-sm text-green-700">{aiDiagnosis.profitabilityAnalysis.comment}</p>
                </div>
              )}
              {aiDiagnosis.efficiencyAnalysis && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium text-purple-900">効率性</h4>
                    <span className={`ml-auto text-xl font-bold ${getScoreColor(aiDiagnosis.efficiencyAnalysis.score)}`}>
                      {aiDiagnosis.efficiencyAnalysis.score}点
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">{aiDiagnosis.efficiencyAnalysis.comment}</p>
                </div>
              )}
            </div>

            {/* 改善提案とリスク */}
            <div className="grid gap-4 md:grid-cols-2">
              {aiDiagnosis.recommendations && aiDiagnosis.recommendations.length > 0 && (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-medium text-emerald-900">改善提案</h4>
                  </div>
                  <ul className="space-y-2">
                    {aiDiagnosis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiDiagnosis.risks && aiDiagnosis.risks.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-900">リスク要因</h4>
                  </div>
                  <ul className="space-y-2">
                    {aiDiagnosis.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
