import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateXLSX, formatDateForFilename, formatDateForXLSX } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const xlsxBuffer = generateXLSX<CustomerData>(
      customers,
      [
        { header: "ID", key: "id", width: 30 },
        { header: "名前", key: "name", width: 20 },
        { header: "メール", key: (item) => item.email || "", width: 30 },
        { header: "電話", key: (item) => item.phone || "", width: 15 },
        { header: "住所", key: (item) => item.address || "", width: 40 },
        { header: "登録日", key: (item) => formatDateForXLSX(item.createdAt), width: 15 },
      ],
      "顧客一覧"
    );

    const filename = `customers_${formatDateForFilename()}.xlsx`;

    return new Response(xlsxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
