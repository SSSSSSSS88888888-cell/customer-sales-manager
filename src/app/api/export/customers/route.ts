import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCSV, formatDateForFilename, formatDateForCSV } from "@/lib/csv";

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

    const csvContent = generateCSV<CustomerData>(customers, [
      { header: "ID", key: "id" },
      { header: "名前", key: "name" },
      { header: "メール", key: (item) => item.email || "" },
      { header: "電話", key: (item) => item.phone || "" },
      { header: "住所", key: (item) => item.address || "" },
      { header: "登録日", key: (item) => formatDateForCSV(item.createdAt) },
    ]);

    const filename = `customers_${formatDateForFilename()}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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
