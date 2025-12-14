import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const journalSchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  debitAccountId: z.string().uuid(),
  creditAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  description: z.string().max(500).optional(),
});

// GET: 仕訳一覧を取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: {
      userId: string;
      date?: { gte?: Date; lte?: Date };
    } = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        include: {
          debitAccount: true,
          creditAccount: true,
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journal.count({ where }),
    ]);

    return NextResponse.json({
      journals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("仕訳取得エラー:", error);
    return NextResponse.json(
      { error: "仕訳の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 仕訳を作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = journalSchema.parse(body);

    // 勘定科目の存在確認
    const [debitAccount, creditAccount] = await Promise.all([
      prisma.chartOfAccount.findFirst({
        where: { id: validatedData.debitAccountId, userId: session.user.id },
      }),
      prisma.chartOfAccount.findFirst({
        where: { id: validatedData.creditAccountId, userId: session.user.id },
      }),
    ]);

    if (!debitAccount) {
      return NextResponse.json(
        { error: "借方勘定科目が見つかりません" },
        { status: 400 }
      );
    }
    if (!creditAccount) {
      return NextResponse.json(
        { error: "貸方勘定科目が見つかりません" },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    return NextResponse.json({ journal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      );
    }
    console.error("仕訳作成エラー:", error);
    return NextResponse.json(
      { error: "仕訳の作成に失敗しました" },
      { status: 500 }
    );
  }
}
