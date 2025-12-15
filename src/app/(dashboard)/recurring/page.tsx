"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Loader2,
  CalendarClock,
  Zap,
} from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
}

interface RecurringJournal {
  id: string;
  name: string;
  debitAccountId: string;
  creditAccountId: string;
  debitAccount: Account;
  creditAccount: Account;
  amount: number;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
}

const frequencyLabels: Record<string, string> = {
  DAILY: "毎日",
  WEEKLY: "毎週",
  MONTHLY: "毎月",
  YEARLY: "毎年",
};

const dayOfWeekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function RecurringPage() {
  const [recurringJournals, setRecurringJournals] = useState<RecurringJournal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    debitAccountId: "",
    creditAccountId: "",
    amount: "",
    description: "",
    frequency: "MONTHLY" as string,
    dayOfMonth: "1",
    dayOfWeek: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rjRes, accRes] = await Promise.all([
        fetch("/api/recurring-journals"),
        fetch("/api/accounts"),
      ]);
      if (rjRes.ok) {
        const rjData = await rjRes.json();
        setRecurringJournals(rjData);
      }
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/recurring-journals/generate", {
        method: "POST",
      });
      const data = await res.json();
      alert(data.message);
      await fetchData();
    } catch (error) {
      console.error("生成エラー:", error);
      alert("仕訳の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.debitAccountId || !form.creditAccountId || !form.amount) {
      alert("必須項目を入力してください");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/recurring-journals/${editingId}`
        : "/api/recurring-journals";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dayOfMonth: form.frequency === "MONTHLY" ? form.dayOfMonth : null,
          dayOfWeek: form.frequency === "WEEKLY" ? form.dayOfWeek : null,
          endDate: form.endDate || null,
        }),
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

  const handleDelete = async (id: string) => {
    if (!confirm("この定期仕訳を削除しますか？")) return;

    try {
      const res = await fetch(`/api/recurring-journals/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const handleToggleActive = async (rj: RecurringJournal) => {
    try {
      await fetch(`/api/recurring-journals/${rj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rj.isActive }),
      });
      await fetchData();
    } catch (error) {
      console.error("更新エラー:", error);
    }
  };

  const handleEdit = (rj: RecurringJournal) => {
    setEditingId(rj.id);
    setForm({
      name: rj.name,
      debitAccountId: rj.debitAccountId,
      creditAccountId: rj.creditAccountId,
      amount: rj.amount.toString(),
      description: rj.description || "",
      frequency: rj.frequency,
      dayOfMonth: rj.dayOfMonth?.toString() || "1",
      dayOfWeek: rj.dayOfWeek?.toString() || "1",
      startDate: rj.startDate.split("T")[0],
      endDate: rj.endDate ? rj.endDate.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      debitAccountId: "",
      creditAccountId: "",
      amount: "",
      description: "",
      frequency: "MONTHLY",
      dayOfMonth: "1",
      dayOfWeek: "1",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const getScheduleLabel = (rj: RecurringJournal) => {
    switch (rj.frequency) {
      case "DAILY":
        return "毎日";
      case "WEEKLY":
        return `毎週${dayOfWeekLabels[rj.dayOfWeek || 0]}曜日`;
      case "MONTHLY":
        return `毎月${rj.dayOfMonth}日`;
      case "YEARLY":
        return "毎年";
      default:
        return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">定期仕訳</h1>
            <p className="text-sm text-slate-500">繰り返し発生する仕訳を自動化</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            今日分を生成
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Plus className="h-4 w-4" />
                新規作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "定期仕訳を編集" : "定期仕訳を作成"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>定期仕訳名 *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="例：家賃支払い"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>借方勘定科目 *</Label>
                    <Select
                      value={form.debitAccountId}
                      onValueChange={(v) => setForm({ ...form, debitAccountId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>貸方勘定科目 *</Label>
                    <Select
                      value={form.creditAccountId}
                      onValueChange={(v) => setForm({ ...form, creditAccountId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>金額 *</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>頻度 *</Label>
                    <Select
                      value={form.frequency}
                      onValueChange={(v) => setForm({ ...form, frequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">毎日</SelectItem>
                        <SelectItem value="WEEKLY">毎週</SelectItem>
                        <SelectItem value="MONTHLY">毎月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.frequency === "WEEKLY" && (
                  <div className="space-y-2">
                    <Label>曜日</Label>
                    <Select
                      value={form.dayOfWeek}
                      onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOfWeekLabels.map((label, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {label}曜日
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.frequency === "MONTHLY" && (
                  <div className="space-y-2">
                    <Label>実行日</Label>
                    <Select
                      value={form.dayOfMonth}
                      onValueChange={(v) => setForm({ ...form, dayOfMonth: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}日
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>摘要</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="取引の説明"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>開始日 *</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>終了日（任意）</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingId ? "更新" : "作成"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 定期仕訳一覧 */}
      {recurringJournals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarClock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">定期仕訳がありません</p>
            <p className="text-sm text-slate-400 mt-1">
              「新規作成」から定期仕訳を登録してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recurringJournals.map((rj) => (
            <Card key={rj.id} className={!rj.isActive ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{rj.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          rj.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {rj.isActive ? "有効" : "停止中"}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                        {getScheduleLabel(rj)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-600">
                      <span>
                        借方: {rj.debitAccount.code} {rj.debitAccount.name}
                      </span>
                      <span>→</span>
                      <span>
                        貸方: {rj.creditAccount.code} {rj.creditAccount.name}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(rj.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>開始: {formatDate(rj.startDate)}</span>
                      {rj.endDate && <span>終了: {formatDate(rj.endDate)}</span>}
                      {rj.lastGeneratedAt && (
                        <span>最終生成: {formatDate(rj.lastGeneratedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(rj)}
                      title={rj.isActive ? "停止" : "有効化"}
                    >
                      {rj.isActive ? (
                        <Pause className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Play className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(rj)}
                    >
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rj.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
