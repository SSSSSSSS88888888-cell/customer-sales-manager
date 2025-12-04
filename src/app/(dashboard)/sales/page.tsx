import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SaleList } from "@/components/forms/sale-list";

export default async function SalesPage() {
  const session = await getServerSession(authOptions);

  const sales = await prisma.sale.findMany({
    where: { userId: session?.user?.id },
    include: { customer: true },
    orderBy: { saleDate: "desc" },
  });

  const customers = await prisma.customer.findMany({
    where: { userId: session?.user?.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales</h2>
        <p className="text-muted-foreground">
          Track and manage your sales
        </p>
      </div>
      <SaleList initialSales={sales} customers={customers} />
    </div>
  );
}
