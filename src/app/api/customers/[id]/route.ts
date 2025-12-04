import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  phone: z.string().regex(/^[\d\-]*$/, "電話番号は数字とハイフンのみ使用できます").optional().or(z.literal("")),
  address: z.string().optional(),
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

    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "顧客が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "顧客が見つかりません" }, { status: 404 });
    }

    const body = await request.json();
    const data = customerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id: id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        memo: data.memo || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "顧客が見つかりません" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true, message: "顧客を削除しました" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
