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
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
}

interface Journal {
  id: string;
  date: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description: string | null;
  debitAccount: ChartOfAccount;
  creditAccount: ChartOfAccount;
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Journal | null>(null);
  const { toast } = useToast();

  // フォーム状態
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    debitAccountId: "",
    creditAccountId: "",
    amount: "",
    description: "",
  });

  // データ取得
  useEffect(() => {
    fetchJournals();
    fetchAccounts();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await fetch("/api/journals");
      const data = await res.json();
      if (res.ok) {
        setJournals(data.journals);
      }
    } catch (error) {
      console.error("仕訳取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/chart-of-accounts");
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error("勘定科目取得エラー:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      date: formData.date,
      debitAccountId: formData.debitAccountId,
      creditAccountId: formData.creditAccountId,
      amount: parseInt(formData.amount),
      description: formData.description || undefined,
    };

    try {
      const res = await fetch(
        editingJournal ? `/api/journals/${editingJournal.id}` : "/api/journals",
        {
          method: editingJournal ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast({
          title: editingJournal ? "仕訳を更新しました" : "仕訳を登録しました",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchJournals();
      } else {
        const data = await res.json();
        toast({
          title: "エラー",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("仕訳保存エラー:", error);
      toast({
        title: "エラー",
        description: "仕訳の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/journals/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "仕訳を削除しました" });
        fetchJournals();
      } else {
        const data = await res.json();
        toast({
          title: "エラー",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("仕訳削除エラー:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      debitAccountId: "",
      creditAccountId: "",
      amount: "",
      description: "",
    });
    setEditingJournal(null);
  };

  const openEditDialog = (journal: Journal) => {
    setEditingJournal(journal);
    setFormData({
      date: journal.date.split("T")[0],
      debitAccountId: journal.debitAccountId,
      creditAccountId: journal.creditAccountId,
      amount: journal.amount.toString(),
      description: journal.description || "",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

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
            <BookOpen className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">仕訳管理</h1>
            <p className="text-sm text-slate-500">仕訳の登録・編集・削除</p>
          </div>
        </div>

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
              仕訳を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingJournal ? "仕訳を編集" : "新規仕訳"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">日付</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="debitAccount">借方勘定科目</Label>
                <Select
                  value={formData.debitAccountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, debitAccountId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="勘定科目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="creditAccount">貸方勘定科目</Label>
                <Select
                  value={formData.creditAccountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, creditAccountId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="勘定科目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">金額</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  placeholder="金額を入力"
                />
              </div>
              <div>
                <Label htmlFor="description">摘要（任意）</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="摘要を入力"
                />
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
                  {editingJournal ? "更新" : "登録"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">仕訳一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {journals.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>仕訳がありません</p>
              <p className="text-sm">「仕訳を追加」から最初の仕訳を登録しましょう</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>借方</TableHead>
                  <TableHead>貸方</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>摘要</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell>{formatDate(journal.date)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {journal.debitAccount.code}
                      </span>
                      <span className="text-slate-500 ml-2">
                        {journal.debitAccount.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {journal.creditAccount.code}
                      </span>
                      <span className="text-slate-500 ml-2">
                        {journal.creditAccount.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(journal.amount)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {journal.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(journal)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(journal)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            <AlertDialogTitle>仕訳を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。仕訳を完全に削除します。
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
