import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Smartphone,
  Zap,
  Gift,
  Github,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestButton } from "@/components/auth/GuestButton";

export default async function LandingPage() {
  const session = await auth();

  // ログイン済みならダッシュボードへリダイレクト
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">Sales Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
            シンプルで使いやすい
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              顧客・売上管理
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            フリーランス・小規模事業者向けの無料ツール。
            <br className="hidden sm:block" />
            複雑な機能は不要、必要なものだけをシンプルに。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              >
                無料で始める
              </Button>
            </Link>
            <div className="w-full sm:w-auto">
              <GuestButton />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            クレジットカード不要・登録30秒
          </p>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              必要な機能をシンプルに
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              小規模ビジネスに必要な機能だけを厳選
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Users}
              title="顧客管理"
              description="顧客情報を一元管理。検索・フィルターで素早くアクセス。"
            />
            <FeatureCard
              icon={TrendingUp}
              title="売上記録"
              description="日々の売上を簡単入力。顧客と紐づけて管理。"
            />
            <FeatureCard
              icon={BarChart3}
              title="月次レポート"
              description="売上推移をグラフで可視化。トレンドを把握。"
            />
            <FeatureCard
              icon={FileSpreadsheet}
              title="Excelエクスポート"
              description="データをExcel形式で出力。確定申告にも便利。"
            />
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              選ばれる理由
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HighlightCard
              icon={Gift}
              title="完全無料"
              description="Supabase無料枠内で運用。月額費用は一切かかりません。"
              color="emerald"
            />
            <HighlightCard
              icon={Smartphone}
              title="スマホ対応"
              description="レスポンシブデザインで、どのデバイスでも快適に操作。"
              color="blue"
            />
            <HighlightCard
              icon={Zap}
              title="シンプル設計"
              description="迷わない直感的なUI。学習コストゼロですぐに使える。"
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* 技術スタックセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">技術スタック</h2>
            <p className="mt-4 text-slate-400">
              モダンな技術で構築されたWebアプリケーション
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <TechBadge>Next.js 14</TechBadge>
            <TechBadge>TypeScript</TechBadge>
            <TechBadge>Tailwind CSS</TechBadge>
            <TechBadge>Prisma</TechBadge>
            <TechBadge>PostgreSQL</TechBadge>
            <TechBadge>Supabase</TechBadge>
            <TechBadge>NextAuth.js</TechBadge>
            <TechBadge>shadcn/ui</TechBadge>
            <TechBadge>Recharts</TechBadge>
          </div>
          <div className="mt-12 text-center">
            <a
              href="https://github.com/SSSSSSSS88888888-cell/customer-sales-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHubでソースコードを見る</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-600">
            このツールはポートフォリオとして制作されました
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a
              href="https://github.com/SSSSSSSS88888888-cell/customer-sales-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Sales Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// 機能カードコンポーネント
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}

// 特徴カードコンポーネント
function HighlightCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: "emerald" | "blue" | "purple";
}) {
  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-14 h-14 ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-6`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

// 技術バッジコンポーネント
function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-sm font-medium">
      {children}
    </span>
  );
}
