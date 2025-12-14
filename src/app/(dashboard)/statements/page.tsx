"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, PieChart, TrendingUp, ArrowRight } from "lucide-react";

const statements = [
  {
    title: "貸借対照表（B/S）",
    description: "資産・負債・純資産の状況を表示します",
    href: "/statements/bs",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "損益計算書（P/L）",
    description: "収益と費用から利益を計算して表示します",
    href: "/statements/pl",
    icon: PieChart,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "キャッシュフロー計算書（C/F）",
    description: "現金の流れを活動別に表示します",
    href: "/statements/cf",
    icon: TrendingUp,
    color: "bg-purple-100 text-purple-600",
  },
];

export default function StatementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">財務諸表</h1>
          <p className="text-sm text-slate-500">仕訳データから財務諸表を自動生成</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {statements.map((statement) => (
          <Link key={statement.href} href={statement.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${statement.color} rounded-xl flex items-center justify-center`}>
                    <statement.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
                <CardTitle className="mt-4">{statement.title}</CardTitle>
                <CardDescription>{statement.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 font-medium group-hover:underline">
                  表示する →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
