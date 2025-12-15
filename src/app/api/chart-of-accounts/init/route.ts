import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AccountType を文字列リテラルとして定義
type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

// 標準勘定科目マスタ
const STANDARD_ACCOUNTS: {
  code: string;
  name: string;
  type: AccountType;
  category: string;
}[] = [
  // 資産
  { code: "100", name: "現金", type: "ASSET", category: "流動資産" },
  { code: "101", name: "普通預金", type: "ASSET", category: "流動資産" },
  { code: "102", name: "当座預金", type: "ASSET", category: "流動資産" },
  { code: "110", name: "売掛金", type: "ASSET", category: "流動資産" },
  { code: "120", name: "商品", type: "ASSET", category: "流動資産" },
  { code: "130", name: "前払費用", type: "ASSET", category: "流動資産" },
  { code: "200", name: "建物", type: "ASSET", category: "固定資産" },
  { code: "210", name: "車両運搬具", type: "ASSET", category: "固定資産" },
  { code: "220", name: "備品", type: "ASSET", category: "固定資産" },
  { code: "230", name: "土地", type: "ASSET", category: "固定資産" },

  // 負債
  { code: "300", name: "買掛金", type: "LIABILITY", category: "流動負債" },
  { code: "310", name: "未払金", type: "LIABILITY", category: "流動負債" },
  { code: "320", name: "短期借入金", type: "LIABILITY", category: "流動負債" },
  { code: "330", name: "預り金", type: "LIABILITY", category: "流動負債" },
  { code: "350", name: "長期借入金", type: "LIABILITY", category: "固定負債" },

  // 純資産
  { code: "400", name: "資本金", type: "EQUITY", category: "資本金" },
  { code: "410", name: "繰越利益剰余金", type: "EQUITY", category: "利益剰余金" },

  // 収益
  { code: "500", name: "売上高", type: "REVENUE", category: "売上高" },
  { code: "510", name: "受取利息", type: "REVENUE", category: "営業外収益" },
  { code: "520", name: "雑収入", type: "REVENUE", category: "営業外収益" },

  // 費用
  { code: "600", name: "仕入高", type: "EXPENSE", category: "売上原価" },
  { code: "700", name: "給料手当", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "710", name: "法定福利費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "720", name: "旅費交通費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "730", name: "通信費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "740", name: "消耗品費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "750", name: "水道光熱費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "760", name: "地代家賃", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "770", name: "減価償却費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "780", name: "支払手数料", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "790", name: "広告宣伝費", type: "EXPENSE", category: "販売費及び一般管理費" },
  { code: "800", name: "支払利息", type: "EXPENSE", category: "営業外費用" },
];

// POST: 標準勘定科目を初期化
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 既存の勘定科目数を確認
    const existingCount = await prisma.chartOfAccount.count({
      where: { userId: session.user.id },
    });

    // 既に勘定科目がある場合はスキップ
    if (existingCount > 0) {
      return NextResponse.json({
        message: "勘定科目は既に存在します",
        created: 0,
      });
    }

    // 標準勘定科目を作成
    const createdAccounts = await Promise.all(
      STANDARD_ACCOUNTS.map((account) =>
        prisma.chartOfAccount.create({
          data: {
            ...account,
            userId: session.user.id,
            isSystem: true,
          },
        })
      )
    );

    return NextResponse.json({
      message: "標準勘定科目を作成しました",
      created: createdAccounts.length,
    });
  } catch (error) {
    console.error("勘定科目初期化エラー:", error);
    return NextResponse.json(
      { error: "勘定科目の初期化に失敗しました" },
      { status: 500 }
    );
  }
}
