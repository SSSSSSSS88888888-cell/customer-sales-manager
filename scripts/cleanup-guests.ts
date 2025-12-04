/**
 * ゲストユーザー削除スクリプト
 *
 * 24時間以上前に作成されたゲストユーザーとその関連データを削除します。
 *
 * 使用方法:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-guests.ts
 *
 * Vercel Cron設定例 (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/cleanup-guests",
 *       "schedule": "0 3 * * *"
 *     }]
 *   }
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupGuests() {
  console.log("Starting guest cleanup...");

  // 24時間前の日時を計算
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  try {
    // 削除対象のゲストユーザーを取得
    const expiredGuests = await prisma.user.findMany({
      where: {
        isGuest: true,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (expiredGuests.length === 0) {
      console.log("No expired guests found.");
      return;
    }

    console.log(`Found ${expiredGuests.length} expired guests to delete:`);
    expiredGuests.forEach((guest) => {
      console.log(`  - ${guest.email} (created: ${guest.createdAt.toISOString()})`);
    });

    const guestIds = expiredGuests.map((g) => g.id);

    // 関連データを削除（カスケード削除されるが明示的に実行）
    // 売上データを先に削除
    const deletedSales = await prisma.sale.deleteMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
    });
    console.log(`Deleted ${deletedSales.count} sales records.`);

    // 顧客データを削除
    const deletedCustomers = await prisma.customer.deleteMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
    });
    console.log(`Deleted ${deletedCustomers.count} customers.`);

    // セッションを削除
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
    });
    console.log(`Deleted ${deletedSessions.count} sessions.`);

    // アカウントを削除
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
    });
    console.log(`Deleted ${deletedAccounts.count} accounts.`);

    // ゲストユーザーを削除
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: guestIds,
        },
      },
    });
    console.log(`Deleted ${deletedUsers.count} guest users.`);

    console.log("Guest cleanup completed successfully!");
  } catch (error) {
    console.error("Error during guest cleanup:", error);
    throw error;
  }
}

cleanupGuests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
