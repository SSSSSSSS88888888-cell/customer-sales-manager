"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
} from "lucide-react";

interface Partner {
  id: string;
  code: string;
  name: string;
  type: "CUSTOMER" | "VENDOR" | "BOTH";
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partner: Partner;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  items: InvoiceItem[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "下書き",
  SENT: "送付済み",
  PAID: "入金済み",
  OVERDUE: "期限超過",
  CANCELLED: "キャンセル",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  DRAFT: Clock,
  SENT: Send,
  PAID: CheckCircle,
  OVERDUE: AlertTriangle,
  CANCELLED: XCircle,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    partnerId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    taxRate: 10,
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceItem[],
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, partRes] = await Promise.all([
        fetch(filterStatus === "all" ? "/api/invoices" : `/api/invoices?status=${filterStatus}`),
        fetch("/api/partners?type=CUSTOMER"),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
      }
      if (partRes.ok) {
        // 顧客とBOTHタイプの取引先を取得
        const allPartners = await fetch("/api/partners").then(r => r.json());
        setPartners(allPartners.filter((p: Partner) => p.type === "CUSTOMER" || p.type === "BOTH"));
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 金額を自動計算
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }

    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length === 1) return;
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.floor(subtotal * form.taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleSave = async () => {
    if (!form.partnerId || form.items.some(item => !item.description || item.amount === 0)) {
      alert("取引先と明細を入力してください");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この請求書を削除しますか？")) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const resetForm = () => {
    setForm({
      partnerId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      taxRate: 10,
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">請求書管理</h1>
            <p className="text-sm text-slate-500">請求書の作成・発行・管理</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>請求書を作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>請求先 *</Label>
                  <Select
                    value={form.partnerId}
                    onValueChange={(v) => setForm({ ...form, partnerId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="取引先を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>税率</Label>
                  <Select
                    value={form.taxRate.toString()}
                    onValueChange={(v) => setForm({ ...form, taxRate: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="8">8%（軽減税率）</SelectItem>
                      <SelectItem value="0">0%（非課税）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>発行日 *</Label>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>支払期限 *</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* 明細 */}
              <div className="space-y-2">
                <Label>明細 *</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium">品目</th>
                        <th className="text-right py-2 px-3 font-medium w-20">数量</th>
                        <th className="text-right py-2 px-3 font-medium w-28">単価</th>
                        <th className="text-right py-2 px-3 font-medium w-28">金額</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              placeholder="品目・サービス名"
                              className="h-8"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-right"
                              min="1"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, "unitPrice", parseInt(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-2 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={form.items.length === 1}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  明細を追加
                </Button>
              </div>

              {/* 合計 */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>消費税（{form.taxRate}%）</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>合計</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="備考・メモ"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* フィルター */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="DRAFT">下書き</SelectItem>
            <SelectItem value="SENT">送付済み</SelectItem>
            <SelectItem value="PAID">入金済み</SelectItem>
            <SelectItem value="OVERDUE">期限超過</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 請求書一覧 */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">請求書がありません</p>
            <p className="text-sm text-slate-400 mt-1">
              「新規作成」から請求書を作成してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const StatusIcon = statusIcons[invoice.status];
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-slate-500">
                          {invoice.invoiceNumber}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusColors[invoice.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[invoice.status]}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {invoice.partner.name}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-slate-600">
                        <span>発行日: {formatDate(invoice.issueDate)}</span>
                        <span>期限: {formatDate(invoice.dueDate)}</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        詳細
                      </Button>
                      {invoice.status === "DRAFT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(invoice.id, "SENT")}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          送付済みにする
                        </Button>
                      )}
                      {invoice.status === "SENT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(invoice.id, "PAID")}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          入金済みにする
                        </Button>
                      )}
                      {invoice.status !== "PAID" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 請求書詳細ダイアログ */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>請求書詳細</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">請求書番号</p>
                  <p className="font-mono font-bold">{viewingInvoice.invoiceNumber}</p>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full ${statusColors[viewingInvoice.status]}`}>
                  {statusLabels[viewingInvoice.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">請求先</p>
                  <p className="font-medium">{viewingInvoice.partner.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">発行日</p>
                  <p>{formatDate(viewingInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-slate-500">支払期限</p>
                  <p>{formatDate(viewingInvoice.dueDate)}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">品目</th>
                      <th className="text-right py-2 px-3 font-medium">数量</th>
                      <th className="text-right py-2 px-3 font-medium">単価</th>
                      <th className="text-right py-2 px-3 font-medium">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-3">{item.description}</td>
                        <td className="py-2 px-3 text-right">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計</span>
                  <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>消費税（{viewingInvoice.taxRate}%）</span>
                  <span>{formatCurrency(viewingInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>合計</span>
                  <span>{formatCurrency(viewingInvoice.totalAmount)}</span>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">備考</p>
                  <p className="text-sm">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
