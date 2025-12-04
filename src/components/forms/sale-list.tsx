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
import type { Sale, Customer, SaleStatus } from "@/types";

interface SaleWithCustomer extends Sale {
  customer: Customer;
}

interface SaleListProps {
  initialSales: SaleWithCustomer[];
  customers: Customer[];
}

const statusColors: Record<SaleStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function SaleList({ initialSales, customers }: SaleListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sales, setSales] = useState(initialSales);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleWithCustomer | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    amount: "",
    description: "",
    saleDate: new Date().toISOString().split("T")[0],
    status: "PENDING" as SaleStatus,
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      amount: "",
      description: "",
      saleDate: new Date().toISOString().split("T")[0],
      status: "PENDING",
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
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) throw new Error("Failed to save sale");

      toast({
        title: editingSale ? "Sale updated" : "Sale created",
        description: `Sale has been ${editingSale ? "updated" : "added"} successfully.`,
      });

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sale: SaleWithCustomer) => {
    setEditingSale(sale);
    setFormData({
      customerId: sale.customerId,
      amount: String(sale.amount),
      description: sale.description || "",
      saleDate: new Date(sale.saleDate).toISOString().split("T")[0],
      status: sale.status,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete sale");

      setSales(sales.filter((s) => s.id !== id));
      toast({
        title: "Sale deleted",
        description: "The sale has been deleted successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete sale.",
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
            <Button disabled={customers.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Edit Sale" : "Add New Sale"}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "Update sale information"
                  : "Enter the details for the new sale"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <select
                    id="customer"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleDate">Sale Date *</Label>
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
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as SaleStatus,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingSale ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {customers.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Please add a customer first before creating sales.
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No sales yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first sale to get started
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {sale.customer.name}
                  </TableCell>
                  <TableCell>${Number(sale.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[sale.status]}`}
                    >
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell>{sale.description || "-"}</TableCell>
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
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(sale.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
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
