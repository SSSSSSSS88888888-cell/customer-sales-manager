import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 定期仕訳一覧取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const recurringJournals = await prisma.recurringJournal.findMany({
      where: { userId: session.user.id },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurringJournals);
  } catch (error) {
    console.error("定期仕訳取得エラー:", error);
    return NextResponse.json(
      { error: "定期仕訳の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 定期仕訳作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      debitAccountId,
      creditAccountId,
      amount,
      description,
      frequency,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
    } = body;

    // バリデーション
    if (!name || !debitAccountId || !creditAccountId || !amount || !frequency || !startDate) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    const recurringJournal = await prisma.recurringJournal.create({
      data: {
        userId: session.user.id,
        name,
        debitAccountId,
        creditAccountId,
        amount: parseInt(amount),
        description: description || null,
        frequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json(recurringJournal, { status: 201 });
  } catch (error) {
    console.error("定期仕訳作成エラー:", error);
    return NextResponse.json(
      { error: "定期仕訳の作成に失敗しました" },
      { status: 500 }
    );
  }
}
