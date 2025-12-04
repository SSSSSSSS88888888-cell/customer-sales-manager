import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// ゲストユーザー用サンプルデータ
const GUEST_CUSTOMERS = [
  { name: "株式会社サンプル商事", email: "sample@example.com", phone: "03-1111-2222", address: "東京都渋谷区1-1-1" },
  { name: "田中デザイン事務所", email: "tanaka-design@example.com", phone: "03-2222-3333", address: "東京都新宿区2-2-2" },
  { name: "ABC株式会社", email: "abc@example.com", phone: "03-3333-4444", address: "東京都港区3-3-3" },
  { name: "山田製作所", email: "yamada@example.com", phone: "03-4444-5555", address: "大阪府大阪市4-4-4" },
  { name: "グローバルトレード合同会社", email: "global@example.com", phone: "03-5555-6666", address: "東京都千代田区5-5-5" },
];

const PRODUCTS = [
  "Webサイト制作",
  "コンサルティング",
  "システム保守",
  "デザイン制作",
  "マーケティング支援",
  "アプリ開発",
];

function generateSalesData(customerId: string, userId: string): { productName: string; amount: number; saleDate: Date; customerId: string; userId: string }[] {
  const sales: { productName: string; amount: number; saleDate: Date; customerId: string; userId: string }[] = [];
  const now = new Date();

  // 過去3ヶ月に分散して売上を生成
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const numSales = Math.floor(Math.random() * 2) + 1; // 1-2件/顧客/月

    for (let i = 0; i < numSales; i++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      // 30,000円〜300,000円
      const amount = Math.floor(Math.random() * 28 + 3) * 10000;
      const day = Math.floor(Math.random() * 28) + 1;
      const saleDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);

      sales.push({
        productName: product,
        amount,
        saleDate,
        customerId,
        userId,
      });
    }
  }

  return sales;
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

    // 顧客データ作成
    const createdCustomers = await Promise.all(
      GUEST_CUSTOMERS.map((customer) =>
        prisma.customer.create({
          data: {
            ...customer,
            userId: guestUser.id,
          },
        })
      )
    );

    // 売上データ作成（各顧客に対して）
    const allSalesData: { productName: string; amount: number; saleDate: Date; customerId: string; userId: string }[] = [];
    for (const customer of createdCustomers) {
      const customerSales = generateSalesData(customer.id, guestUser.id);
      allSalesData.push(...customerSales);
    }

    await prisma.sale.createMany({
      data: allSalesData,
    });

    // ゲストユーザー情報を返す（クライアント側でCredentialsログインに使用）
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
