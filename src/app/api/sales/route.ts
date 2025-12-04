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

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 検索条件
    const where: {
      userId: string;
      customerId?: string;
      saleDate?: { gte?: Date; lte?: Date };
    } = {
      userId: session.user.id,
    };

    // 顧客フィルター
    if (customerId) {
      where.customerId = customerId;
    }

    // 期間フィルター
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    // 売上データと総件数を並列取得
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { saleDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    const sale = await prisma.sale.create({
      data: {
        productName: data.productName,
        amount: data.amount,
        saleDate: new Date(data.saleDate),
        memo: data.memo || null,
        customerId: data.customerId || null,
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
