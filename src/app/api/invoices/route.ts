import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// InvoiceStatus を文字列リテラルとして定義
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// GET: 請求書一覧取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== "all" ? { status: status as InvoiceStatus } : {}),
      },
      include: {
        partner: { select: { id: true, code: true, name: true } },
        items: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("請求書取得エラー:", error);
    return NextResponse.json(
      { error: "請求書の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 請求書作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      partnerId,
      issueDate,
      dueDate,
      taxRate = 10,
      notes,
      items,
    } = body;

    if (!partnerId || !issueDate || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    // 請求書番号を生成
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const count = await prisma.invoice.count({
      where: {
        userId: session.user.id,
        invoiceNumber: { startsWith: `INV-${year}${month}` },
      },
    });
    const invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, "0")}`;

    // 金額計算
    const subtotal = items.reduce((sum: number, item: InvoiceItemInput) => sum + item.amount, 0);
    const taxAmount = Math.floor(subtotal * taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        partnerId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: notes || null,
        items: {
          create: items.map((item: InvoiceItemInput) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: {
        partner: { select: { id: true, code: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("請求書作成エラー:", error);
    return NextResponse.json(
      { error: "請求書の作成に失敗しました" },
      { status: 500 }
    );
  }
}
