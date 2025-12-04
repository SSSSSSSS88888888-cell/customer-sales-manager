"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaleForm, type Sale, type Customer } from "@/components/forms/SaleForm";
import { SalesTable } from "@/components/SalesTable";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter, X, Loader2, Download } from "lucide-react";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  customerId: string;
  startDate: string;
  endDate: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    customerId: "",
    startDate: "",
    endDate: "",
  });
  const [tempFilters, setTempFilters] = useState<Filters>({
    customerId: "",
    startDate: "",
    endDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // 顧客一覧を取得
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  // 売上一覧を取得
  const fetchSales = useCallback(
    async (page: number, currentFilters: Filters) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        if (currentFilters.customerId) {
          params.append("customerId", currentFilters.customerId);
        }
        if (currentFilters.startDate) {
          params.append("startDate", currentFilters.startDate);
        }
        if (currentFilters.endDate) {
          params.append("endDate", currentFilters.endDate);
        }

        const response = await fetch(`/api/sales?${params}`);
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }

        const data = await response.json();
        setSales(data.sales);
        setPagination(data.pagination);
      } catch (error) {
        toast({
          title: "エラー",
          description:
            error instanceof Error ? error.message : "データの取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchSales(pagination.page, filters);
  }, [pagination.page, filters, fetchSales]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    const cleared = { customerId: "", startDate: "", endDate: "" };
    setTempFilters(cleared);
    setFilters(cleared);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    filters.customerId || filters.startDate || filters.endDate;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAdd = () => {
    setEditingSale(null);
    setIsFormOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      toast({
        title: "成功",
        description: "売上を削除しました",
      });

      fetchSales(pagination.page, filters);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    toast({
      title: "成功",
      description: editingSale ? "売上を更新しました" : "売上を追加しました",
    });
    fetchSales(pagination.page, filters);
  };

  // 売上合計を計算
  const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const response = await fetch(`/api/export/sales?${params}`);
      if (!response.ok) {
        throw new Error("エクスポートに失敗しました");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "sales.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "成功",
        description: "CSVファイルをダウンロードしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "エクスポートに失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            売上管理
          </h2>
          <p className="text-slate-600">売上データの登録・編集・削除ができます</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            フィルター
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs">
                適用中
              </span>
            )}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            売上を追加
          </Button>
        </div>
      </div>

      {/* フィルター */}
      {showFilters && (
        <div className="rounded-lg border bg-slate-50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 顧客フィルター */}
            <div className="space-y-2">
              <Label>顧客</Label>
              <Select
                value={tempFilters.customerId}
                onValueChange={(value) =>
                  setTempFilters({
                    ...tempFilters,
                    customerId: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべての顧客" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての顧客</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 開始日 */}
            <div className="space-y-2">
              <Label>開始日</Label>
              <Input
                type="date"
                value={tempFilters.startDate}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, startDate: e.target.value })
                }
              />
            </div>

            {/* 終了日 */}
            <div className="space-y-2">
              <Label>終了日</Label>
              <Input
                type="date"
                value={tempFilters.endDate}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                クリア
              </Button>
            )}
            <Button onClick={handleApplyFilters}>適用</Button>
          </div>
        </div>
      )}

      {/* 合計表示 */}
      {sales.length > 0 && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              表示中の売上合計（{sales.length}件）
            </span>
            <span className="text-xl font-bold text-blue-600">
              ¥{totalAmount.toLocaleString("ja-JP")}
            </span>
          </div>
        </div>
      )}

      {/* ローディング */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <SalesTable
          sales={sales}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* フォームモーダル */}
      <SaleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        sale={editingSale}
        customers={customers}
      />
    </div>
  );
}
