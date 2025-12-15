import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface JournalRow {
  date: string;
  description: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number;
}

// POST: CSVインポート
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "インポートデータがありません" }, { status: 400 });
    }

    // ユーザーの勘定科目を取得
    const accounts = await prisma.chartOfAccount.findMany({
      where: { userId: session.user.id },
    });

    const accountMap = new Map(accounts.map(a => [a.code, a.id]));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 各行を処理
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as JournalRow;
      const rowNum = i + 1;

      try {
        // バリデーション
        if (!row.date) {
          results.errors.push(`行${rowNum}: 日付が必要です`);
          results.failed++;
          continue;
        }

        if (!row.debitAccountCode) {
          results.errors.push(`行${rowNum}: 借方勘定科目コードが必要です`);
          results.failed++;
          continue;
        }

        if (!row.creditAccountCode) {
          results.errors.push(`行${rowNum}: 貸方勘定科目コードが必要です`);
          results.failed++;
          continue;
        }

        if (!row.amount || row.amount <= 0) {
          results.errors.push(`行${rowNum}: 金額は正の数値が必要です`);
          results.failed++;
          continue;
        }

        // 勘定科目の存在確認
        const debitAccountId = accountMap.get(row.debitAccountCode);
        const creditAccountId = accountMap.get(row.creditAccountCode);

        if (!debitAccountId) {
          results.errors.push(`行${rowNum}: 借方勘定科目コード「${row.debitAccountCode}」が見つかりません`);
          results.failed++;
          continue;
        }

        if (!creditAccountId) {
          results.errors.push(`行${rowNum}: 貸方勘定科目コード「${row.creditAccountCode}」が見つかりません`);
          results.failed++;
          continue;
        }

        // 仕訳を作成
        await prisma.journal.create({
          data: {
            date: new Date(row.date),
            description: row.description || "",
            debitAccountId,
            creditAccountId,
            amount: row.amount,
            userId: session.user.id,
          },
        });

        results.success++;
      } catch (error) {
        console.error(`行${rowNum}のインポートエラー:`, error);
        results.errors.push(`行${rowNum}: インポートに失敗しました`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `インポート完了: ${results.success}件成功, ${results.failed}件失敗`,
      ...results,
    });
  } catch (error) {
    console.error("インポートエラー:", error);
    return NextResponse.json(
      { error: "インポートに失敗しました" },
      { status: 500 }
    );
  }
}
