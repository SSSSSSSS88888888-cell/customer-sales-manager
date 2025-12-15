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
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
} from "lucide-react";

interface TradingPartner {
  id: string;
  code: string;
  name: string;
  type: "CUSTOMER" | "VENDOR" | "BOTH";
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  postalCode: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

const partnerTypeLabels: Record<string, string> = {
  CUSTOMER: "顧客",
  VENDOR: "仕入先",
  BOTH: "顧客/仕入先",
};

const partnerTypeColors: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  VENDOR: "bg-amber-100 text-amber-700",
  BOTH: "bg-green-100 text-green-700",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<TradingPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "CUSTOMER" as string,
    contactPerson: "",
    email: "",
    phone: "",
    postalCode: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    fetchPartners();
  }, [filterType]);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const url = filterType === "all"
        ? "/api/partners"
        : `/api/partners?type=${filterType}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (error) {
      console.error("取引先取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.type) {
      alert("取引先コード、名前、区分は必須です");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/partners/${editingId}`
        : "/api/partners";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        await fetchPartners();
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
    if (!confirm("この取引先を削除しますか？")) return;

    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchPartners();
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const handleEdit = (partner: TradingPartner) => {
    setEditingId(partner.id);
    setForm({
      code: partner.code,
      name: partner.name,
      type: partner.type,
      contactPerson: partner.contactPerson || "",
      email: partner.email || "",
      phone: partner.phone || "",
      postalCode: partner.postalCode || "",
      address: partner.address || "",
      notes: partner.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      code: "",
      name: "",
      type: "CUSTOMER",
      contactPerson: "",
      email: "",
      phone: "",
      postalCode: "",
      address: "",
      notes: "",
    });
  };

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">取引先管理</h1>
            <p className="text-sm text-slate-500">顧客・仕入先の登録・管理</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "取引先を編集" : "取引先を登録"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>取引先コード *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="例: C001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>区分 *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">顧客</SelectItem>
                      <SelectItem value="VENDOR">仕入先</SelectItem>
                      <SelectItem value="BOTH">顧客/仕入先</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>取引先名 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="株式会社〇〇"
                />
              </div>

              <div className="space-y-2">
                <Label>担当者名</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="山田太郎"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>メールアドレス</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>電話番号</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>郵便番号</Label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="100-0001"
                  className="w-32"
                />
              </div>

              <div className="space-y-2">
                <Label>住所</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="東京都千代田区..."
                />
              </div>

              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="メモ・備考"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingId ? "更新" : "登録"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* フィルター */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="取引先を検索..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="CUSTOMER">顧客のみ</SelectItem>
            <SelectItem value="VENDOR">仕入先のみ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 取引先一覧 */}
      {filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">取引先がありません</p>
            <p className="text-sm text-slate-400 mt-1">
              「新規登録」から取引先を追加してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-500">{partner.code}</span>
                    <h3 className="font-semibold text-slate-900">{partner.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${partnerTypeColors[partner.type]}`}>
                    {partnerTypeLabels[partner.type]}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  {partner.contactPerson && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{partner.contactPerson}</span>
                    </div>
                  )}
                  {partner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                  {partner.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{partner.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(partner)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(partner.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
