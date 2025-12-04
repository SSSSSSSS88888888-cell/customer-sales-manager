"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react";
import type { Sale, Customer } from "@/types";

interface SaleWithCustomer extends Sale {
  customer: Customer | null;
}

interface SaleListProps {
  initialSales: SaleWithCustomer[];
  customers: Customer[];
}

export function SaleList({ initialSales, customers }: SaleListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sales, setSales] = useState(initialSales);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleWithCustomer | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    productName: "",
    amount: "",
    saleDate: new Date().toISOString().split("T")[0],
    memo: "",
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      productName: "",
      amount: "",
      saleDate: new Date().toISOString().split("T")[0],
      memo: "",
    });
    setEditingSale(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingSale ? `/api/sales/${editingSale.id}` : "/api/sales";
      const method = editingSale ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customerId: formData.customerId || null,
          amount: parseInt(formData.amount, 10),
        }),
      });

      if (!response.ok) throw new Error("Failed to save sale");

      toast({
        title: editingSale ? "売上を更新しました" : "売上を登録しました",
        description: `売上情報を${editingSale ? "更新" : "登録"}しました。`,
      });

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast({
        title: "エラー",
        description: "保存に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sale: SaleWithCustomer) => {
    setEditingSale(sale);
    setFormData({
      customerId: sale.customerId || "",
      productName: sale.productName,
      amount: String(sale.amount),
      saleDate: new Date(sale.saleDate).toISOString().split("T")[0],
      memo: sale.memo || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この売上を削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete sale");

      setSales(sales.filter((s) => s.id !== id));
      toast({
        title: "売上を削除しました",
        description: "売上情報を削除しました。",
      });
    } catch {
      toast({
        title: "エラー",
        description: "削除に失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              売上を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "売上を編集" : "新規売上登録"}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "売上情報を更新します"
                  : "新しい売上の情報を入力してください"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="productName">商品名 *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData({ ...formData, productName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">金額（円） *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleDate">売上日 *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, saleDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer">顧客（任意）</Label>
                  <select
                    id="customer"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                  >
                    <option value="">顧客を選択（任意）</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memo">メモ</Label>
                  <Input
                    id="memo"
                    value={formData.memo}
                    onChange={(e) =>
                      setFormData({ ...formData, memo: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "保存中..." : editingSale ? "更新" : "登録"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品名</TableHead>
              <TableHead>金額</TableHead>
              <TableHead>売上日</TableHead>
              <TableHead>顧客</TableHead>
              <TableHead>メモ</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">売上がまだ登録されていません</p>
                  <p className="text-sm text-muted-foreground">
                    最初の売上を登録しましょう
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {sale.productName}
                  </TableCell>
                  <TableCell>¥{Number(sale.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>{sale.customer?.name || "-"}</TableCell>
                  <TableCell>{sale.memo || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(sale)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(sale.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
