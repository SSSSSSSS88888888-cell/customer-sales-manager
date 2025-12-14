import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const journalSchema = z.object({
  date: z.string().transform((val) => new Date(val)).optional(),
  debitAccountId: z.string().uuid().optional(),
  creditAccountId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  description: z.string().max(500).optional().nullable(),
});

// GET: 仕訳を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    const journal = await prisma.journal.findFirst({
      where: { id, userId: session.user.id },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    if (!journal) {
      return NextResponse.json(
        { error: "仕訳が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ journal });
  } catch (error) {
    console.error("仕訳取得エラー:", error);
    return NextResponse.json(
      { error: "仕訳の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 仕訳を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = journalSchema.parse(body);

    // 仕訳の存在確認
    const existing = await prisma.journal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "仕訳が見つかりません" },
        { status: 404 }
      );
    }

    // 勘定科目の存在確認
    if (validatedData.debitAccountId) {
      const debitAccount = await prisma.chartOfAccount.findFirst({
        where: { id: validatedData.debitAccountId, userId: session.user.id },
      });
      if (!debitAccount) {
        return NextResponse.json(
          { error: "借方勘定科目が見つかりません" },
          { status: 400 }
        );
      }
    }
    if (validatedData.creditAccountId) {
      const creditAccount = await prisma.chartOfAccount.findFirst({
        where: { id: validatedData.creditAccountId, userId: session.user.id },
      });
      if (!creditAccount) {
        return NextResponse.json(
          { error: "貸方勘定科目が見つかりません" },
          { status: 400 }
        );
      }
    }

    const journal = await prisma.journal.update({
      where: { id },
      data: validatedData,
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    return NextResponse.json({ journal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      );
    }
    console.error("仕訳更新エラー:", error);
    return NextResponse.json(
      { error: "仕訳の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 仕訳を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    // 仕訳の存在確認
    const existing = await prisma.journal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "仕訳が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.journal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "仕訳を削除しました" });
  } catch (error) {
    console.error("仕訳削除エラー:", error);
    return NextResponse.json(
      { error: "仕訳の削除に失敗しました" },
      { status: 500 }
    );
  }
}
