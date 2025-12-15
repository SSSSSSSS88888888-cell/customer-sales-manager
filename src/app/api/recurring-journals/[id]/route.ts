import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT: 定期仕訳更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 所有者確認
    const existing = await prisma.recurringJournal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "定期仕訳が見つかりません" },
        { status: 404 }
      );
    }

    const updated = await prisma.recurringJournal.update({
      where: { id },
      data: {
        name: body.name,
        debitAccountId: body.debitAccountId,
        creditAccountId: body.creditAccountId,
        amount: body.amount ? parseInt(body.amount) : undefined,
        description: body.description,
        frequency: body.frequency,
        dayOfMonth: body.dayOfMonth ? parseInt(body.dayOfMonth) : null,
        dayOfWeek: body.dayOfWeek !== undefined ? parseInt(body.dayOfWeek) : null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive,
      },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("定期仕訳更新エラー:", error);
    return NextResponse.json(
      { error: "定期仕訳の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 定期仕訳削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    // 所有者確認
    const existing = await prisma.recurringJournal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "定期仕訳が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.recurringJournal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("定期仕訳削除エラー:", error);
    return NextResponse.json(
      { error: "定期仕訳の削除に失敗しました" },
      { status: 500 }
    );
  }
}
