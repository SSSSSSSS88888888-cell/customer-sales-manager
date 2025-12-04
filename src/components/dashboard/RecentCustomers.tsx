import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, UserPlus } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

interface RecentCustomersProps {
  customers: Customer[];
}

export function RecentCustomers({ customers }: RecentCustomersProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <CardTitle className="text-lg text-slate-900">直近追加した顧客</CardTitle>
        </div>
        <Link href="/customers">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            もっと見る
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">顧客がまだいません</p>
              <Link href="/customers">
                <Button variant="outline" size="sm" className="mt-3">
                  <UserPlus className="mr-2 h-4 w-4" />
                  顧客を追加する
                </Button>
              </Link>
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-500">
                      {customer.email || "メールなし"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(customer.createdAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
