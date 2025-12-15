import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// NotificationType を文字列リテラルとして定義
type NotificationType = "PAYMENT_DUE" | "INVOICE_OVERDUE" | "RECEIVABLE_DUE" | "GOAL_ACHIEVED" | "GOAL_WARNING" | "SYSTEM";

interface Invoice {
  id: string;
  invoiceNumber: string;
  dueDate: Date;
  status: string;
  totalAmount: number;
  partner: {
    name: string;
  };
}

// POST: 通知を生成（支払期限チェックなど）
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const generatedNotifications: { type: NotificationType; title: string; message: string; relatedId?: string }[] = [];

    // 1. 支払期限が近い請求書（未払い、送付済み）
    const upcomingDueInvoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["SENT"] },
        dueDate: {
          gte: today,
          lte: sevenDaysLater,
        },
      },
      include: {
        partner: { select: { name: true } },
      },
    });

    for (const invoice of upcomingDueInvoices) {
      const inv = invoice as Invoice;
      const daysUntilDue = Math.ceil(
        (new Date(inv.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 同じ請求書に対する既存の通知をチェック
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: session.user.id,
          relatedId: inv.id,
          type: "PAYMENT_DUE",
          createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) }, // 24時間以内
        },
      });

      if (!existingNotification) {
        generatedNotifications.push({
          type: "PAYMENT_DUE",
          title: "支払期限のお知らせ",
          message: `請求書 ${inv.invoiceNumber}（${inv.partner.name}）の支払期限まで${daysUntilDue}日です。金額: ¥${inv.totalAmount.toLocaleString()}`,
          relatedId: inv.id,
        });
      }
    }

    // 2. 期限超過の請求書
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["SENT", "OVERDUE"] },
        dueDate: { lt: today },
      },
      include: {
        partner: { select: { name: true } },
      },
    });

    for (const invoice of overdueInvoices) {
      const inv = invoice as Invoice;
      const daysOverdue = Math.ceil(
        (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // ステータスをOVERDUEに更新
      if (inv.status !== "OVERDUE") {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: "OVERDUE" },
        });
      }

      // 既存の通知をチェック
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: session.user.id,
          relatedId: inv.id,
          type: "INVOICE_OVERDUE",
          createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingNotification) {
        generatedNotifications.push({
          type: "INVOICE_OVERDUE",
          title: "請求書期限超過",
          message: `請求書 ${inv.invoiceNumber}（${inv.partner.name}）の支払期限が${daysOverdue}日超過しています。金額: ¥${inv.totalAmount.toLocaleString()}`,
          relatedId: inv.id,
        });
      }
    }

    // 3. 売掛金回収リマインダー（売上仕訳で30日以上前のもの）
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldReceivables = await prisma.journal.findMany({
      where: {
        userId: session.user.id,
        date: { lt: thirtyDaysAgo },
        debitAccount: {
          code: "110", // 売掛金
        },
      },
      include: {
        debitAccount: { select: { name: true } },
      },
      take: 5,
    });

    if (oldReceivables.length > 0) {
      const totalReceivables = oldReceivables.reduce((sum: number, j: { amount: number }) => sum + j.amount, 0);

      // 既存の通知をチェック
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: session.user.id,
          type: "RECEIVABLE_DUE",
          createdAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }, // 7日以内
        },
      });

      if (!existingNotification) {
        generatedNotifications.push({
          type: "RECEIVABLE_DUE",
          title: "売掛金回収のお知らせ",
          message: `30日以上経過した売掛金が${oldReceivables.length}件あります。合計: ¥${totalReceivables.toLocaleString()}`,
        });
      }
    }

    // 通知を一括作成
    if (generatedNotifications.length > 0) {
      await prisma.notification.createMany({
        data: generatedNotifications.map((n) => ({
          userId: session.user.id,
          type: n.type,
          title: n.title,
          message: n.message,
          relatedId: n.relatedId || null,
        })),
      });
    }

    return NextResponse.json({
      message: `${generatedNotifications.length}件の通知を生成しました`,
      generated: generatedNotifications.length,
    });
  } catch (error) {
    console.error("通知生成エラー:", error);
    return NextResponse.json(
      { error: "通知の生成に失敗しました" },
      { status: 500 }
    );
  }
}
