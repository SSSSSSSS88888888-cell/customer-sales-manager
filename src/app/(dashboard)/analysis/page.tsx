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
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

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

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"];

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
        return "bg-yellow-500 text-white";
      case "A":
        return "bg-green-500 text-white";
      case "B":
        return "bg-blue-500 text-white";
      case "C":
        return "bg-orange-500 text-white";
      case "D":
        return "bg-red-500 text-white";
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
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
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

  // チャート用データ
  const profitData = data ? [
    { name: "売上高", value: data.summary.sales },
    { name: "売上総利益", value: data.summary.grossProfit },
    { name: "営業利益", value: data.summary.operatingIncome },
    { name: "純利益", value: data.summary.netIncome },
  ] : [];

  const bsData = data ? [
    { name: "資産", value: data.summary.totalAssets },
    { name: "負債", value: data.summary.totalLiabilities },
    { name: "純資産", value: data.summary.equity },
  ] : [];

  const pieData = data ? [
    { name: "負債", value: data.summary.totalLiabilities },
    { name: "純資産", value: data.summary.equity },
  ] : [];

  // レーダーチャート用データ（財務指標）
  const radarData = data?.ratios
    .filter(r => r.value !== null)
    .slice(0, 6)
    .map(r => ({
      subject: r.name.replace(/（.*）/, ""),
      value: Math.min((r.value || 0) / r.benchmark * 100, 150),
      fullMark: 150,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calculator className="h-5 w-5 text-blue-600" />
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
          className="bg-purple-600 hover:bg-purple-700 gap-2"
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
          <CardHeader className="bg-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6" />
                <CardTitle className="text-white">AI財務診断レポート</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-purple-200">総合スコア</p>
                  <p className="text-3xl font-bold text-white">
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

      {/* サマリーカード */}
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

      {/* グラフセクション */}
      {data && (data.summary.sales > 0 || data.summary.totalAssets > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 損益構造 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">損益構造</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 資本構成 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">資本構成</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 財務バランス */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">財務バランス</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {bsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 財務指標レーダー */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">財務指標バランス</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="達成率"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                      <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  基準値に対する達成率（100% = 基準値達成）
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
