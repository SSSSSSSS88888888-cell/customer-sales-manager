"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Sale } from "@/components/forms/SaleForm";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SalesTableProps {
  sales: Sale[];
  pagination: Pagination;
  onEdit: (sale: Sale) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

// 金額をフォーマット（¥1,234,567形式）
const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString("ja-JP")}`;
};

// 日付をフォーマット（YYYY/MM/DD形式）
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export function SalesTable({
  sales,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  isLoading,
}: SalesTableProps) {
  if (sales.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">売上データがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>売上日</TableHead>
              <TableHead>顧客</TableHead>
              <TableHead>商品/サービス</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">
                  {formatDate(sale.saleDate)}
                </TableCell>
                <TableCell>
                  {sale.customer?.name || (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatAmount(sale.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(sale)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>売上を削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{sale.productName}」（{formatAmount(sale.amount)}）を削除しますか？
                            この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(sale.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            全{pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <span className="text-sm text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
