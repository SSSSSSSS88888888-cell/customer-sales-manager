import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// GET: 請求書詳細取得
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

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: {
        partner: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "請求書が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("請求書取得エラー:", error);
    return NextResponse.json(
      { error: "請求書の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 請求書更新（ステータス変更など）
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
    const existing = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "請求書が見つかりません" },
        { status: 404 }
      );
    }

    // ステータス変更のみの場合
    if (body.status && Object.keys(body).length === 1) {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: body.status },
        include: {
          partner: { select: { id: true, code: true, name: true } },
          items: true,
        },
      });
      return NextResponse.json(updated);
    }

    // フル更新（下書き状態のみ）
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "下書き状態の請求書のみ編集できます" },
        { status: 400 }
      );
    }

    const { partnerId, issueDate, dueDate, taxRate, notes, items } = body;

    // 金額再計算
    const subtotal = items.reduce((sum: number, item: InvoiceItemInput) => sum + item.amount, 0);
    const taxAmount = Math.floor(subtotal * taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 既存の明細を削除して新規作成
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("請求書更新エラー:", error);
    return NextResponse.json(
      { error: "請求書の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 請求書削除
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
    const existing = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "請求書が見つかりません" },
        { status: 404 }
      );
    }

    // 入金済みの請求書は削除不可
    if (existing.status === "PAID") {
      return NextResponse.json(
        { error: "入金済みの請求書は削除できません" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("請求書削除エラー:", error);
    return NextResponse.json(
      { error: "請求書の削除に失敗しました" },
      { status: 500 }
    );
  }
}
