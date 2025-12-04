import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  saleDate: z.string().or(z.date()),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: { customer: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = saleSchema.parse(body);

    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const sale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId,
        amount: data.amount,
        description: data.description || null,
        saleDate: new Date(data.saleDate),
        status: data.status,
      },
      include: { customer: true },
    });

    return NextResponse.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    await prisma.sale.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
