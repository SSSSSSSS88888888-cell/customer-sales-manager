import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  productName: z.string().min(1, "商品/サービス名は必須です").max(200, "商品/サービス名は200文字以内で入力してください"),
  amount: z.number().min(1, "金額は1円以上で入力してください"),
  saleDate: z.string().refine((date) => {
    const parsed = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return !isNaN(parsed.getTime()) && parsed <= today;
  }, "有効な日付を入力してください（未来日は不可）"),
  memo: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "売上が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 既存の売上確認
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "売上が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = saleSchema.parse(body);

    // 顧客が指定されている場合、所有者確認
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          userId: session.user.id,
        },
      });
      if (!customer) {
        return NextResponse.json(
          { error: "指定された顧客が見つかりません" },
          { status: 400 }
        );
      }
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        productName: data.productName,
        amount: data.amount,
        saleDate: new Date(data.saleDate),
        memo: data.memo || null,
        customerId: data.customerId || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 既存の売上確認
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "売上が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ message: "売上を削除しました" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
