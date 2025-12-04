import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerList } from "@/components/forms/customer-list";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  const customers = await prisma.customer.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground">
          Manage your customer database
        </p>
      </div>
      <CustomerList initialCustomers={customers} />
    </div>
  );
}
