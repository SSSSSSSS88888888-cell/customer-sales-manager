import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CustomerSaleGroup {
  customerId: string | null;
  _sum: {
    amount: number | null;
  };
  _count: {
    id: number;
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    // 期間の設定
    let startDate: Date;
    let endDate: Date;

    if (month) {
      // 月指定がある場合
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // 年間
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    // 顧客別売上を集計
    const customerSales = await prisma.sale.groupBy({
      by: ["customerId"],
      where: {
        userId: session.user.id,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        customerId: {
          not: null,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 10,
    }) as unknown as CustomerSaleGroup[];

    // 顧客情報を取得
    const customerIds = customerSales
      .map((s) => s.customerId)
      .filter((id): id is string => id !== null);

    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const customerMap = new Map(customers.map((c: { id: string; name: string }) => [c.id, c.name]));

    // ランキングデータを作成
    const ranking = customerSales.map((sale, index) => ({
      rank: index + 1,
      customerId: sale.customerId,
      customerName: sale.customerId ? customerMap.get(sale.customerId) || "不明" : "顧客なし",
      totalAmount: sale._sum.amount || 0,
      transactionCount: sale._count.id,
    }));

    // 顧客なしの売上も集計
    const noCustomerSales = await prisma.sale.aggregate({
      where: {
        userId: session.user.id,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        customerId: null,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      year,
      month,
      ranking,
      noCustomerSales: {
        totalAmount: noCustomerSales._sum.amount || 0,
        transactionCount: noCustomerSales._count.id,
      },
    });
  } catch (error) {
    console.error("Error fetching customer report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
