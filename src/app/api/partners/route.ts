import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 取引先一覧取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const partners = await prisma.tradingPartner.findMany({
      where: {
        userId: session.user.id,
        ...(type && type !== "all" ? { type: type as "CUSTOMER" | "VENDOR" | "BOTH" } : {}),
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error("取引先取得エラー:", error);
    return NextResponse.json(
      { error: "取引先の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 取引先作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      type,
      contactPerson,
      email,
      phone,
      postalCode,
      address,
      notes,
    } = body;

    if (!code || !name || !type) {
      return NextResponse.json(
        { error: "取引先コード、名前、区分は必須です" },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.tradingPartner.findFirst({
      where: { userId: session.user.id, code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "この取引先コードは既に使用されています" },
        { status: 400 }
      );
    }

    const partner = await prisma.tradingPartner.create({
      data: {
        userId: session.user.id,
        code,
        name,
        type,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        postalCode: postalCode || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("取引先作成エラー:", error);
    return NextResponse.json(
      { error: "取引先の作成に失敗しました" },
      { status: 500 }
    );
  }
}
