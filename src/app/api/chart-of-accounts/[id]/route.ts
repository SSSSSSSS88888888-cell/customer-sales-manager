import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const accountSchema = z.object({
  code: z.string().min(1).max(10).optional(),
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]).optional(),
  category: z.string().min(1).max(100).optional(),
});

// PATCH: 勘定科目を更新
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
    const validatedData = accountSchema.parse(body);

    // 勘定科目の存在確認と所有者確認
    const existing = await prisma.chartOfAccount.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "勘定科目が見つかりません" },
        { status: 404 }
      );
    }

    // コード変更時の重複チェック
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await prisma.chartOfAccount.findUnique({
        where: {
          userId_code: {
            userId: session.user.id,
            code: validatedData.code,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "この勘定科目コードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.issues },
        { status: 400 }
      );
    }
    console.error("勘定科目更新エラー:", error);
    return NextResponse.json(
      { error: "勘定科目の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 勘定科目を削除
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

    // 勘定科目の存在確認と所有者確認
    const existing = await prisma.chartOfAccount.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "勘定科目が見つかりません" },
        { status: 404 }
      );
    }

    // 仕訳で使用されているかチェック
    const journalCount = await prisma.journal.count({
      where: {
        OR: [{ debitAccountId: id }, { creditAccountId: id }],
      },
    });

    if (journalCount > 0) {
      return NextResponse.json(
        { error: "この勘定科目は仕訳で使用されているため削除できません" },
        { status: 400 }
      );
    }

    await prisma.chartOfAccount.delete({
      where: { id },
    });

    return NextResponse.json({ message: "勘定科目を削除しました" });
  } catch (error) {
    console.error("勘定科目削除エラー:", error);
    return NextResponse.json(
      { error: "勘定科目の削除に失敗しました" },
      { status: 500 }
    );
  }
}
