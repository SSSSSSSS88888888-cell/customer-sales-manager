import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST: AI財務診断
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // API キーの確認
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI機能が設定されていません。ANTHROPIC_API_KEYを設定してください。" },
        { status: 503 }
      );
    }

    // 今年度の期間を設定
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const endDate = new Date();

    // 仕訳データを取得
    const journals = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    if (journals.length === 0) {
      return NextResponse.json({
        diagnosis: "仕訳データがありません。仕訳を登録してから財務診断を実行してください。",
        recommendations: [],
        score: null,
      });
    }

    // 勘定科目別に残高を計算
    const balances = new Map<string, { account: typeof journals[0]["debitAccount"]; balance: number }>();

    for (const journal of journals) {
      // 借方
      const debitKey = journal.debitAccountId;
      const debitCurrent = balances.get(debitKey) || { account: journal.debitAccount, balance: 0 };
      if (journal.debitAccount.type === "ASSET" || journal.debitAccount.type === "EXPENSE") {
        debitCurrent.balance += journal.amount;
      } else {
        debitCurrent.balance -= journal.amount;
      }
      balances.set(debitKey, debitCurrent);

      // 貸方
      const creditKey = journal.creditAccountId;
      const creditCurrent = balances.get(creditKey) || { account: journal.creditAccount, balance: 0 };
      if (journal.creditAccount.type === "ASSET" || journal.creditAccount.type === "EXPENSE") {
        creditCurrent.balance -= journal.amount;
      } else {
        creditCurrent.balance += journal.amount;
      }
      balances.set(creditKey, creditCurrent);
    }

    // 財務データを集計
    let currentAssets = 0;
    let fixedAssets = 0;
    let currentLiabilities = 0;
    let fixedLiabilities = 0;
    let equity = 0;
    let sales = 0;
    let costOfSales = 0;
    let sgaExpenses = 0;
    let otherRevenues = 0;
    let otherExpenses = 0;

    Array.from(balances.values()).forEach((data) => {
      const { account, balance } = data;
      const absBalance = Math.abs(balance);

      if (account.type === "ASSET") {
        if (account.category === "流動資産") {
          currentAssets += absBalance;
        } else {
          fixedAssets += absBalance;
        }
      } else if (account.type === "LIABILITY") {
        if (account.category === "流動負債") {
          currentLiabilities += absBalance;
        } else {
          fixedLiabilities += absBalance;
        }
      } else if (account.type === "EQUITY") {
        equity += absBalance;
      } else if (account.type === "REVENUE") {
        if (account.category === "売上高") {
          sales += absBalance;
        } else {
          otherRevenues += absBalance;
        }
      } else if (account.type === "EXPENSE") {
        if (account.category === "売上原価") {
          costOfSales += absBalance;
        } else if (account.category === "販売費及び一般管理費") {
          sgaExpenses += absBalance;
        } else {
          otherExpenses += absBalance;
        }
      }
    });

    const totalAssets = currentAssets + fixedAssets;
    const totalLiabilities = currentLiabilities + fixedLiabilities;
    const grossProfit = sales - costOfSales;
    const operatingIncome = grossProfit - sgaExpenses;
    const netIncome = operatingIncome + otherRevenues - otherExpenses;

    // 財務指標を計算
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : null;
    const equityRatio = (totalAssets > 0 ? (equity / totalAssets) * 100 : null);
    const grossProfitMargin = sales > 0 ? (grossProfit / sales) * 100 : null;
    const operatingProfitMargin = sales > 0 ? (operatingIncome / sales) * 100 : null;
    const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : null;
    const roe = equity > 0 ? (netIncome / equity) * 100 : null;

    // Claude API で分析
    const prompt = `あなたは経験豊富な財務アナリストです。以下の財務データを分析し、日本語で診断結果を提供してください。

## 財務データ（単位：円）

### 資産
- 流動資産: ${currentAssets.toLocaleString()}
- 固定資産: ${fixedAssets.toLocaleString()}
- 総資産: ${totalAssets.toLocaleString()}

### 負債
- 流動負債: ${currentLiabilities.toLocaleString()}
- 固定負債: ${fixedLiabilities.toLocaleString()}
- 総負債: ${totalLiabilities.toLocaleString()}

### 純資産
- 自己資本: ${equity.toLocaleString()}

### 損益
- 売上高: ${sales.toLocaleString()}
- 売上原価: ${costOfSales.toLocaleString()}
- 売上総利益: ${grossProfit.toLocaleString()}
- 販管費: ${sgaExpenses.toLocaleString()}
- 営業利益: ${operatingIncome.toLocaleString()}
- 当期純利益: ${netIncome.toLocaleString()}

### 財務指標
- 流動比率: ${currentRatio !== null ? currentRatio.toFixed(1) + '%' : 'N/A'}
- 自己資本比率: ${equityRatio !== null ? equityRatio.toFixed(1) + '%' : 'N/A'}
- 売上総利益率: ${grossProfitMargin !== null ? grossProfitMargin.toFixed(1) + '%' : 'N/A'}
- 営業利益率: ${operatingProfitMargin !== null ? operatingProfitMargin.toFixed(1) + '%' : 'N/A'}
- ROA: ${roa !== null ? roa.toFixed(1) + '%' : 'N/A'}
- ROE: ${roe !== null ? roe.toFixed(1) + '%' : 'N/A'}

## 診断要件

以下のJSON形式で回答してください：
{
  "overallScore": (0-100の総合スコア),
  "grade": "(S/A/B/C/Dのグレード)",
  "summary": "(2-3文の総合診断)",
  "safetyAnalysis": {
    "score": (0-100),
    "comment": "(安全性についての評価コメント)"
  },
  "profitabilityAnalysis": {
    "score": (0-100),
    "comment": "(収益性についての評価コメント)"
  },
  "efficiencyAnalysis": {
    "score": (0-100),
    "comment": "(効率性についての評価コメント)"
  },
  "recommendations": [
    "(改善提案1)",
    "(改善提案2)",
    "(改善提案3)"
  ],
  "risks": [
    "(リスク要因1)",
    "(リスク要因2)"
  ]
}

JSONのみを出力し、他の説明は含めないでください。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // レスポンスを解析
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let diagnosis;
    try {
      // JSONを抽出
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON not found");
      }
    } catch {
      // JSON解析に失敗した場合はテキストをそのまま返す
      diagnosis = {
        overallScore: 50,
        grade: "C",
        summary: responseText,
        recommendations: [],
        risks: [],
      };
    }

    return NextResponse.json({
      diagnosis,
      financialData: {
        totalAssets,
        totalLiabilities,
        equity,
        sales,
        grossProfit,
        operatingIncome,
        netIncome,
        currentRatio,
        equityRatio,
        grossProfitMargin,
        operatingProfitMargin,
        roa,
        roe,
      },
    });
  } catch (error) {
    console.error("AI診断エラー:", error);
    return NextResponse.json(
      { error: "AI診断の実行に失敗しました" },
      { status: 500 }
    );
  }
}
