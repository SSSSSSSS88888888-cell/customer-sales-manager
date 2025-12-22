import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  BookOpen,
  FileText,
  PieChart,
  Calculator,
  Smartphone,
  Zap,
  Gift,
  Github,
  ExternalLink,
  TrendingUp,
  FileSpreadsheet,
  Brain,
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
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">ZaimuAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
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
            仕訳を入力するだけで
            <span className="block mt-2 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              財務諸表を自動生成
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            貸借対照表（BS）・損益計算書（PL）・キャッシュフロー計算書（CF）を
            <br className="hidden sm:block" />
            AIの力でかんたんに作成。中小企業・個人事業主の財務管理をサポート。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-lg px-8 py-6"
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
              財務諸表作成をシンプルに
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              仕訳入力から財務諸表出力までをワンストップで
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={BookOpen}
              title="仕訳管理"
              description="借方・貸方の仕訳を簡単入力。勘定科目マスタも標準搭載。"
            />
            <FeatureCard
              icon={FileText}
              title="貸借対照表（BS）"
              description="資産・負債・純資産を自動集計。バランスチェックも自動。"
            />
            <FeatureCard
              icon={PieChart}
              title="損益計算書（PL）"
              description="売上高から当期純利益まで。収益性を一目で把握。"
            />
            <FeatureCard
              icon={TrendingUp}
              title="キャッシュフロー（CF）"
              description="営業・投資・財務活動別に現金の流れを可視化。"
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
              description="登録も利用も完全無料。月額費用は一切かかりません。"
              color="red"
            />
            <HighlightCard
              icon={FileSpreadsheet}
              title="PDF・Excel出力"
              description="作成した財務諸表をPDFやExcel形式でダウンロード可能。"
              color="orange"
            />
            <HighlightCard
              icon={Brain}
              title="AI分析（将来予定）"
              description="AIが財務データを分析し、経営改善のヒントを提案。"
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* 追加機能セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              使いやすさへのこだわり
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HighlightCard
              icon={Smartphone}
              title="スマホ対応"
              description="レスポンシブデザインで、どのデバイスでも快適に操作。"
              color="blue"
            />
            <HighlightCard
              icon={Zap}
              title="シンプル設計"
              description="迷わない直感的なUI。会計知識がなくても使える。"
              color="green"
            />
            <HighlightCard
              icon={Calculator}
              title="勘定科目マスタ"
              description="標準的な勘定科目をプリセット。カスタマイズも自由。"
              color="amber"
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
            ZaimuAI - AI財務諸表メーカー
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
            &copy; {new Date().getFullYear()} ZaimuAI. All rights reserved.
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
      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-red-600" />
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
  color: "red" | "orange" | "purple" | "blue" | "green" | "amber";
}) {
  const colorClasses = {
    red: "bg-red-100 text-red-600",
    orange: "bg-red-100 text-red-700",
    purple: "bg-red-50 text-red-700",
    blue: "bg-black/10 text-black",
    green: "bg-red-100 text-red-600",
    amber: "bg-black/10 text-black",
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
