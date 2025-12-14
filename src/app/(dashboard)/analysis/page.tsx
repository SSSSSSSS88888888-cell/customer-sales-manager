"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI財務分析</h1>
          <p className="text-sm text-slate-500">AIによる財務データの自動分析</p>
        </div>
      </div>

      {/* Coming Soon メッセージ */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-purple-700 max-w-md mx-auto">
              AI財務分析機能は現在開発中です。
              将来的には以下の機能が利用可能になる予定です。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 予定機能の説明 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">トレンド分析</CardTitle>
            <CardDescription>
              売上・利益のトレンドを自動分析し、成長パターンを可視化します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>・月次推移グラフ</li>
              <li>・前年同期比較</li>
              <li>・季節変動の検出</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">異常検知</CardTitle>
            <CardDescription>
              通常と異なるパターンを検出し、早期に警告します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>・急激な増減の検出</li>
              <li>・キャッシュフロー警告</li>
              <li>・コスト異常の発見</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">改善提案</CardTitle>
            <CardDescription>
              財務データに基づいた経営改善のヒントを提案します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>・コスト削減ポイント</li>
              <li>・収益性向上の提案</li>
              <li>・資金繰り改善案</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 補足情報 */}
      <Card className="bg-slate-50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">
                AI分析機能について
              </h3>
              <p className="text-sm text-slate-600">
                この機能はAnthropicのClaude APIを活用して、財務データの自動分析と
                インサイト抽出を行う予定です。仕訳データが十分に蓄積された後、
                より精度の高い分析が可能になります。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
