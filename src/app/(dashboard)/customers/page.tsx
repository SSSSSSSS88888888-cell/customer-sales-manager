import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerList } from "@/components/forms/customer-list";

export default async function CustomersPage() {
  const session = await auth();

  const customers = await prisma.customer.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">顧客管理</h2>
        <p className="text-muted-foreground">
          顧客情報を管理します
        </p>
      </div>
      <CustomerList initialCustomers={customers} />
    </div>
  );
}
