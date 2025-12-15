import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 取引先詳細取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    const partner = await prisma.tradingPartner.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "取引先が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("取引先取得エラー:", error);
    return NextResponse.json(
      { error: "取引先の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 取引先更新
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
    const existing = await prisma.tradingPartner.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "取引先が見つかりません" },
        { status: 404 }
      );
    }

    const updated = await prisma.tradingPartner.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        postalCode: body.postalCode || null,
        address: body.address || null,
        notes: body.notes || null,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("取引先更新エラー:", error);
    return NextResponse.json(
      { error: "取引先の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 取引先削除
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
    const existing = await prisma.tradingPartner.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "取引先が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.tradingPartner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("取引先削除エラー:", error);
    return NextResponse.json(
      { error: "取引先の削除に失敗しました" },
      { status: 500 }
    );
  }
}
