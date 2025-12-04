import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // デモユーザーの作成
  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "デモユーザー",
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.email}`);

  // 顧客データの作成
  const customersData = [
    { name: "田中太郎", email: "tanaka@example.com", phone: "03-1234-5678", address: "東京都渋谷区1-1-1" },
    { name: "佐藤花子", email: "sato@example.com", phone: "03-2345-6789", address: "東京都新宿区2-2-2" },
    { name: "鈴木一郎", email: "suzuki@example.com", phone: "03-3456-7890", address: "東京都港区3-3-3" },
    { name: "高橋美咲", email: "takahashi@example.com", phone: "03-4567-8901", address: "東京都千代田区4-4-4" },
    { name: "伊藤健太", email: "ito@example.com", phone: "03-5678-9012", address: "東京都品川区5-5-5" },
    { name: "山本優子", email: "yamamoto@example.com", phone: "03-6789-0123", address: "東京都目黒区6-6-6" },
    { name: "中村大輔", email: "nakamura@example.com", phone: "03-7890-1234", address: "東京都世田谷区7-7-7" },
    { name: "小林真理", email: "kobayashi@example.com", phone: "03-8901-2345", address: "東京都杉並区8-8-8" },
  ];

  // 既存の顧客を削除してから作成（売上データも自動的に削除される）
  await prisma.sale.deleteMany({
    where: { userId: user.id },
  });
  await prisma.customer.deleteMany({
    where: { userId: user.id },
  });

  const createdCustomers = await prisma.customer.createMany({
    data: customersData.map((customer) => ({
      ...customer,
      userId: user.id,
    })),
  });

  // 作成した顧客を取得
  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
  });

  console.log(`Created ${customers.length} customers`);

  // 売上データの作成（過去3ヶ月分）
  const products = [
    "Webサイト制作",
    "ロゴデザイン",
    "SNS運用代行",
    "SEOコンサルティング",
    "広告運用",
    "システム開発",
    "保守サポート",
    "動画制作",
  ];

  const now = new Date();
  const salesData = [];

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const numSales = Math.floor(Math.random() * 10) + 5; // 5-15件/月

    for (let i = 0; i < numSales; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const amount = Math.floor(Math.random() * 50 + 5) * 10000; // 5万〜55万円

      const saleDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);

      salesData.push({
        customerId: customer.id,
        productName: product,
        amount,
        saleDate,
        userId: user.id,
      });
    }
  }

  await prisma.sale.createMany({
    data: salesData,
  });

  console.log(`Created ${salesData.length} sales records`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
