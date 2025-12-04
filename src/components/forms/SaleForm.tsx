"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface Sale {
  id: string;
  productName: string;
  amount: number;
  saleDate: string;
  memo: string | null;
  customerId: string | null;
  customer: {
    id: string;
    name: string;
  } | null;
}

export interface Customer {
  id: string;
  name: string;
}

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale: Sale | null;
  customers: Customer[];
}

export function SaleForm({
  isOpen,
  onClose,
  onSuccess,
  sale,
  customers,
}: SaleFormProps) {
  const [formData, setFormData] = useState({
    customerId: "",
    productName: "",
    amount: "",
    saleDate: "",
    memo: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sale) {
      setFormData({
        customerId: sale.customerId || "",
        productName: sale.productName,
        amount: sale.amount.toString(),
        saleDate: sale.saleDate.split("T")[0],
        memo: sale.memo || "",
      });
    } else {
      setFormData({
        customerId: "",
        productName: "",
        amount: "",
        saleDate: new Date().toISOString().split("T")[0],
        memo: "",
      });
    }
    setErrors({});
  }, [sale, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = "商品/サービス名は必須です";
    } else if (formData.productName.length > 200) {
      newErrors.productName = "商品/サービス名は200文字以内で入力してください";
    }

    const amount = parseInt(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = "金額は必須です";
    } else if (amount < 1) {
      newErrors.amount = "金額は1円以上で入力してください";
    }

    if (!formData.saleDate) {
      newErrors.saleDate = "売上日は必須です";
    } else {
      const selectedDate = new Date(formData.saleDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.saleDate = "未来の日付は指定できません";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = sale ? `/api/sales/${sale.id}` : "/api/sales";
      const method = sale ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId || null,
          productName: formData.productName,
          amount: parseInt(formData.amount),
          saleDate: formData.saleDate,
          memo: formData.memo || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      onSuccess();
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "保存に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {sale ? "売上を編集" : "売上を追加"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 顧客 */}
          <div className="space-y-2">
            <Label htmlFor="customerId">顧客</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) =>
                setFormData({ ...formData, customerId: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="顧客を選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">顧客なし</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 商品/サービス名 */}
          <div className="space-y-2">
            <Label htmlFor="productName">
              商品/サービス名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
              placeholder="例: コンサルティング"
              className={errors.productName ? "border-red-500" : ""}
            />
            {errors.productName && (
              <p className="text-sm text-red-500">{errors.productName}</p>
            )}
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              金額 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ¥
              </span>
              <Input
                id="amount"
                type="number"
                min="1"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="例: 100000"
                className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* 売上日 */}
          <div className="space-y-2">
            <Label htmlFor="saleDate">
              売上日 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={(e) =>
                setFormData({ ...formData, saleDate: e.target.value })
              }
              max={new Date().toISOString().split("T")[0]}
              className={errors.saleDate ? "border-red-500" : ""}
            />
            {errors.saleDate && (
              <p className="text-sm text-red-500">{errors.saleDate}</p>
            )}
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="備考など"
              rows={3}
            />
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {sale ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
