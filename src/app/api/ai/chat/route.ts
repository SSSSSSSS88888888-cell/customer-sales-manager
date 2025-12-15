import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// POST: AIチャット
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI機能が設定されていません" },
        { status: 503 }
      );
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "メッセージが必要です" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ユーザーの財務データを取得
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const endDate = new Date();

    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { debitAccount: true, creditAccount: true },
    });

    // 財務データを集計
    let sales = 0, expenses = 0, assets = 0, liabilities = 0, equity = 0;

    for (const journal of journals) {
      if (journal.creditAccount.type === "REVENUE") {
        sales += journal.amount;
      }
      if (journal.debitAccount.type === "EXPENSE") {
        expenses += journal.amount;
      }
      if (journal.debitAccount.type === "ASSET") {
        assets += journal.amount;
      }
      if (journal.creditAccount.type === "ASSET") {
        assets -= journal.amount;
      }
      if (journal.creditAccount.type === "LIABILITY") {
        liabilities += journal.amount;
      }
      if (journal.creditAccount.type === "EQUITY") {
        equity += journal.amount;
      }
    }

    const profit = sales - expenses;

    // システムプロンプト
    const systemPrompt = `あなたは「Zaimu AI」という名前の財務アドバイザーAIです。
ユーザーの財務データに基づいて、分かりやすく丁寧にアドバイスを提供してください。

## ユーザーの現在の財務状況（${new Date().getFullYear()}年）
- 売上高: ${sales.toLocaleString()}円
- 費用: ${expenses.toLocaleString()}円
- 利益: ${profit.toLocaleString()}円
- 資産: ${assets.toLocaleString()}円
- 負債: ${liabilities.toLocaleString()}円
- 純資産: ${equity.toLocaleString()}円
- 仕訳件数: ${journals.length}件

## 回答のガイドライン
- 日本語で回答してください
- 専門用語は分かりやすく説明してください
- 具体的な数字を使って説明してください
- 改善提案は実行可能なものを提示してください
- 必要に応じて財務指標（流動比率、ROA、ROEなど）を計算して説明してください
- 親しみやすく、でもプロフェッショナルな口調で回答してください`;

    // 会話履歴を構築
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // 過去の会話履歴を追加（最大10件）
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // 新しいメッセージを追加
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || "申し訳ありません。回答を生成できませんでした。";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("チャットエラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: `チャットエラー: ${errorMessage}` },
      { status: 500 }
    );
  }
}
