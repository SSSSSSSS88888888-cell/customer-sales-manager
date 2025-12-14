"use client";

import { useState, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, BookMarked, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  category: string;
  isSystem: boolean;
}

const ACCOUNT_TYPES = [
  { value: "ASSET", label: "資産", color: "bg-blue-100 text-blue-700" },
  { value: "LIABILITY", label: "負債", color: "bg-orange-100 text-orange-700" },
  { value: "EQUITY", label: "純資産", color: "bg-green-100 text-green-700" },
  { value: "REVENUE", label: "収益", color: "bg-purple-100 text-purple-700" },
  { value: "EXPENSE", label: "費用", color: "bg-red-100 text-red-700" },
];

const CATEGORIES: Record<string, string[]> = {
  ASSET: ["流動資産", "固定資産", "繰延資産"],
  LIABILITY: ["流動負債", "固定負債"],
  EQUITY: ["資本金", "利益剰余金", "評価差額"],
  REVENUE: ["売上高", "営業外収益", "特別利益"],
  EXPENSE: ["売上原価", "販売費及び一般管理費", "営業外費用", "特別損失", "法人税等"],
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartOfAccount | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "ASSET" as ChartOfAccount["type"],
    category: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/chart-of-accounts");
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error("勘定科目取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAccounts = async () => {
    try {
      const res = await fetch("/api/chart-of-accounts/init", {
        method: "POST",
      });
      if (res.ok) {
        await fetchAccounts();
        toast({
          title: "標準勘定科目を初期化しました",
          description: "30種類以上の勘定科目が作成されました",
        });
      }
    } catch (error) {
      console.error("初期化エラー:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(
        editingAccount
          ? `/api/chart-of-accounts/${editingAccount.id}`
          : "/api/chart-of-accounts",
        {
          method: editingAccount ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        toast({
          title: editingAccount ? "勘定科目を更新しました" : "勘定科目を追加しました",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        const data = await res.json();
        toast({
          title: "エラー",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("保存エラー:", error);
      toast({
        title: "エラー",
        description: "勘定科目の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/chart-of-accounts/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "勘定科目を削除しました" });
        fetchAccounts();
      } else {
        const data = await res.json();
        toast({
          title: "エラー",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("削除エラー:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      type: "ASSET",
      category: "",
    });
    setEditingAccount(null);
  };

  const openEditDialog = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
    });
    setIsDialogOpen(true);
  };

  const getTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];
  };

  const filteredAccounts = filterType === "ALL"
    ? accounts
    : accounts.filter((a) => a.type === filterType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <BookMarked className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">勘定科目管理</h1>
            <p className="text-sm text-slate-500">勘定科目の追加・編集・削除</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={initializeAccounts} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              標準科目を初期化
            </Button>
          )}

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                勘定科目を追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "勘定科目を編集" : "新規勘定科目"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">勘定科目コード</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                      placeholder="例: 100"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">勘定科目名</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="例: 現金"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">勘定科目区分</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ChartOfAccount["type"]) =>
                      setFormData({ ...formData, type: value, category: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="区分を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES[formData.type]?.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    {editingAccount ? "更新" : "追加"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        <Button
          variant={filterType === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("ALL")}
          className={filterType === "ALL" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          すべて ({accounts.length})
        </Button>
        {ACCOUNT_TYPES.map((type) => {
          const count = accounts.filter((a) => a.type === type.value).length;
          return (
            <Button
              key={type.value}
              variant={filterType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type.value)}
              className={filterType === type.value ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {type.label} ({count})
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">勘定科目一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookMarked className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>勘定科目がありません</p>
              <p className="text-sm">「勘定科目を追加」から登録してください</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">コード</TableHead>
                  <TableHead>勘定科目名</TableHead>
                  <TableHead>区分</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => {
                  const typeInfo = getTypeInfo(account.type);
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {account.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(account)}
                            disabled={account.isSystem}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>勘定科目を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。仕訳で使用されている場合は削除できません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
