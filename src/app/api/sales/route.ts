import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  productName: z.string().min(1, "商品名は必須です"),
  amount: z.number().int().positive("金額は正の整数である必要があります"),
  saleDate: z.string().or(z.date()),
  memo: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      where: { userId: session.user.id },
      include: { customer: true },
      orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = saleSchema.parse(body);

    // 顧客IDが指定されている場合は存在確認
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          userId: session.user.id,
        },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    const sale = await prisma.sale.create({
      data: {
        productName: data.productName,
        amount: data.amount,
        saleDate: new Date(data.saleDate),
        memo: data.memo || null,
        customerId: data.customerId || null,
        userId: session.user.id,
      },
      include: { customer: true },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
