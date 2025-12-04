import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCSV, formatDateForFilename, formatDateForCSV } from "@/lib/csv";

interface SaleWithCustomer {
  id: string;
  productName: string;
  amount: number;
  saleDate: Date;
  customer: {
    name: string;
  } | null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 検索条件
    const where: {
      userId: string;
      saleDate?: { gte?: Date; lte?: Date };
    } = {
      userId: session.user.id,
    };

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

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    const csvContent = generateCSV<SaleWithCustomer>(sales, [
      { header: "ID", key: "id" },
      { header: "顧客名", key: (item) => item.customer?.name || "" },
      { header: "商品名", key: "productName" },
      { header: "金額", key: (item) => item.amount.toString() },
      { header: "売上日", key: (item) => formatDateForCSV(item.saleDate) },
    ]);

    const filename = `sales_${formatDateForFilename()}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
