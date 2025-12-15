import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 通知一覧取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    // 保存済み通知を取得
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // 未読数を取得
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("通知取得エラー:", error);
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 通知を既読にする
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // すべての通知を既読に
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json({ message: "すべての通知を既読にしました" });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "通知IDが必要です" },
        { status: 400 }
      );
    }

    // 特定の通知を既読に
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { isRead: true },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "通知を既読にしました" });
  } catch (error) {
    console.error("通知更新エラー:", error);
    return NextResponse.json(
      { error: "通知の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 通知削除
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteRead = searchParams.get("deleteRead") === "true";

    if (deleteRead) {
      // 既読の通知をすべて削除
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          isRead: true,
        },
      });

      return NextResponse.json({ message: "既読の通知を削除しました" });
    }

    if (!id) {
      return NextResponse.json(
        { error: "通知IDが必要です" },
        { status: 400 }
      );
    }

    const deleted = await prisma.notification.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "通知を削除しました" });
  } catch (error) {
    console.error("通知削除エラー:", error);
    return NextResponse.json(
      { error: "通知の削除に失敗しました" },
      { status: 500 }
    );
  }
}
