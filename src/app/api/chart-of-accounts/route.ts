import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const accountSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  category: z.string().min(1).max(100),
});

// GET: 勘定科目一覧を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("勘定科目取得エラー:", error);
    return NextResponse.json(
      { error: "勘定科目の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 勘定科目を作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = accountSchema.parse(body);

    // 重複チェック
    const existing = await prisma.chartOfAccount.findUnique({
      where: {
        userId_code: {
          userId: session.user.id,
          code: validatedData.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "この勘定科目コードは既に使用されています" },
        { status: 400 }
      );
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      );
    }
    console.error("勘定科目作成エラー:", error);
    return NextResponse.json(
      { error: "勘定科目の作成に失敗しました" },
      { status: 500 }
    );
  }
}
