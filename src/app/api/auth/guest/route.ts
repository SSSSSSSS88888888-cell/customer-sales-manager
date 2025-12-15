import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

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

// サンプル仕訳生成関数
function generateSampleJournals(
  userId: string,
  accountMap: Map<string, string>
): {
  date: Date;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description: string;
  userId: string;
}[] {
  const journals: {
    date: Date;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description: string;
    userId: string;
  }[] = [];

  const now = new Date();
  const year = now.getFullYear();

  // 期首: 資本金 3,000,000円
  journals.push({
    date: new Date(year, 0, 1),
    debitAccountId: accountMap.get("101")!, // 普通預金
    creditAccountId: accountMap.get("400")!, // 資本金
    amount: 3000000,
    description: "設立時出資",
    userId,
  });

  // 1月〜現在月までのサンプル仕訳
  for (let month = 0; month <= now.getMonth(); month++) {
    // 売上 (3-5件/月)
    const salesCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < salesCount; i++) {
      const day = Math.floor(Math.random() * 25) + 1;
      const amount = (Math.floor(Math.random() * 20) + 5) * 10000; // 50,000〜250,000
      journals.push({
        date: new Date(year, month, day),
        debitAccountId: accountMap.get("100")!, // 現金
        creditAccountId: accountMap.get("500")!, // 売上高
        amount,
        description: `売上 ${month + 1}月-${i + 1}`,
        userId,
      });
    }

    // 仕入 (1-2件/月)
    const purchaseCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < purchaseCount; i++) {
      const day = Math.floor(Math.random() * 25) + 1;
      const amount = (Math.floor(Math.random() * 10) + 3) * 10000; // 30,000〜130,000
      journals.push({
        date: new Date(year, month, day),
        debitAccountId: accountMap.get("600")!, // 仕入高
        creditAccountId: accountMap.get("100")!, // 現金
        amount,
        description: `商品仕入 ${month + 1}月-${i + 1}`,
        userId,
      });
    }

    // 給料 (月末)
    journals.push({
      date: new Date(year, month, 25),
      debitAccountId: accountMap.get("700")!, // 給料手当
      creditAccountId: accountMap.get("101")!, // 普通預金
      amount: 300000,
      description: `${month + 1}月分給与`,
      userId,
    });

    // 家賃 (月末)
    journals.push({
      date: new Date(year, month, 27),
      debitAccountId: accountMap.get("760")!, // 地代家賃
      creditAccountId: accountMap.get("101")!, // 普通預金
      amount: 100000,
      description: `${month + 1}月分家賃`,
      userId,
    });

    // 水道光熱費
    journals.push({
      date: new Date(year, month, 20),
      debitAccountId: accountMap.get("750")!, // 水道光熱費
      creditAccountId: accountMap.get("101")!, // 普通預金
      amount: 15000 + Math.floor(Math.random() * 5000),
      description: `${month + 1}月分光熱費`,
      userId,
    });

    // 通信費
    journals.push({
      date: new Date(year, month, 15),
      debitAccountId: accountMap.get("730")!, // 通信費
      creditAccountId: accountMap.get("101")!, // 普通預金
      amount: 8000 + Math.floor(Math.random() * 2000),
      description: `${month + 1}月分通信費`,
      userId,
    });

    // 現金を預金に入金 (月1回)
    journals.push({
      date: new Date(year, month, 28),
      debitAccountId: accountMap.get("101")!, // 普通預金
      creditAccountId: accountMap.get("100")!, // 現金
      amount: 500000,
      description: "現金預入",
      userId,
    });
  }

  return journals;
}

export async function POST() {
  try {
    // ユニークなゲストID生成
    const guestId = nanoid(10);
    const guestEmail = `guest_${guestId}@example.com`;

    // ゲストユーザー作成
    const guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        name: "ゲストユーザー",
        password: null,
        isGuest: true,
      },
    });

    // 勘定科目マスタ作成
    const createdAccounts = await Promise.all(
      STANDARD_ACCOUNTS.map((account) =>
        prisma.chartOfAccount.create({
          data: {
            ...account,
            userId: guestUser.id,
            isSystem: true,
          },
        })
      )
    );

    // コード -> ID のマップ作成
    const accountMap = new Map<string, string>();
    for (const account of createdAccounts) {
      accountMap.set(account.code, account.id);
    }

    // サンプル仕訳データ作成
    const sampleJournals = generateSampleJournals(guestUser.id, accountMap);

    await prisma.journal.createMany({
      data: sampleJournals,
    });

    // ゲストユーザー情報を返す
    return NextResponse.json({
      success: true,
      guestId: guestUser.id,
      email: guestEmail,
    });
  } catch (error) {
    console.error("Guest creation error:", error);
    return NextResponse.json(
      { error: "ゲストユーザーの作成に失敗しました" },
      { status: 500 }
    );
  }
}
