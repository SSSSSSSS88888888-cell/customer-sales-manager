"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Target,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GoalPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

interface Goal {
  id: string;
  name: string;
  period: GoalPeriod;
  year: number;
  month: number | null;
  quarter: number | null;
  targetAmount: number;
  actualAmount: number;
  achievementRate: number;
  notes: string | null;
}

interface GoalData {
  goals: Goal[];
  summary: {
    yearlyTotal: number;
    yearlyTarget: number;
    yearlyAchievementRate: number;
    monthlySales: Record<string, number>;
  };
}

const periodLabels: Record<GoalPeriod, string> = {
  MONTHLY: "月次",
  QUARTERLY: "四半期",
  YEARLY: "年次",
};

const quarterLabels: Record<number, string> = {
  1: "第1四半期（1-3月）",
  2: "第2四半期（4-6月）",
  3: "第3四半期（7-9月）",
  4: "第4四半期（10-12月）",
};

export default function GoalsPage() {
  const [data, setData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  // フォーム状態
  const [formName, setFormName] = useState("");
  const [formPeriod, setFormPeriod] = useState<GoalPeriod>("MONTHLY");
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1);
  const [formQuarter, setFormQuarter] = useState(1);
  const [formTargetAmount, setFormTargetAmount] = useState("");

  useEffect(() => {
    fetchGoals();
  }, [year]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?year=${year}`);
      if (!res.ok) throw new Error("目標の取得に失敗しました");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "目標の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!formName.trim() || !formTargetAmount) {
      toast({
        title: "エラー",
        description: "目標名と目標金額を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          period: formPeriod,
          year,
          month: formPeriod === "MONTHLY" ? formMonth : null,
          quarter: formPeriod === "QUARTERLY" ? formQuarter : null,
          targetAmount: parseInt(formTargetAmount),
        }),
      });

      if (!res.ok) throw new Error("目標の作成に失敗しました");

      toast({
        title: "成功",
        description: "目標を作成しました",
      });

      setFormName("");
      setFormPeriod("MONTHLY");
      setFormMonth(new Date().getMonth() + 1);
      setFormQuarter(1);
      setFormTargetAmount("");
      setIsCreateOpen(false);
      fetchGoals();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "目標の作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("目標の削除に失敗しました");

      toast({
        title: "成功",
        description: "目標を削除しました",
      });

      fetchGoals();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "目標の削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP").format(amount);
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 100) return "bg-green-500";
    if (rate >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getGoalPeriodLabel = (goal: Goal) => {
    if (goal.period === "MONTHLY" && goal.month) {
      return `${goal.month}月`;
    } else if (goal.period === "QUARTERLY" && goal.quarter) {
      return `Q${goal.quarter}`;
    } else {
      return "年間";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">目標設定</h1>
          <p className="text-slate-500">売上目標を設定し達成率を追跡</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium w-16 text-center">{year}年</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear(year + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                目標追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しい目標を追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">目標名 *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例: 売上目標"
                  />
                </div>
                <div>
                  <Label>期間タイプ *</Label>
                  <Select
                    value={formPeriod}
                    onValueChange={(value) => setFormPeriod(value as GoalPeriod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">月次</SelectItem>
                      <SelectItem value="QUARTERLY">四半期</SelectItem>
                      <SelectItem value="YEARLY">年次</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formPeriod === "MONTHLY" && (
                  <div>
                    <Label>対象月 *</Label>
                    <Select
                      value={formMonth.toString()}
                      onValueChange={(value) => setFormMonth(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m}月
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formPeriod === "QUARTERLY" && (
                  <div>
                    <Label>対象四半期 *</Label>
                    <Select
                      value={formQuarter.toString()}
                      onValueChange={(value) => setFormQuarter(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((q) => (
                          <SelectItem key={q} value={q.toString()}>
                            {quarterLabels[q]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="targetAmount">目標金額 *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full">
                  追加する
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* サマリーカード */}
      {data && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">年間目標</p>
                  <p className="text-2xl font-bold">
                    ¥{formatCurrency(data.summary.yearlyTarget)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">年間実績</p>
                  <p className="text-2xl font-bold">
                    ¥{formatCurrency(data.summary.yearlyTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  data.summary.yearlyAchievementRate >= 100 ? "bg-green-100" :
                  data.summary.yearlyAchievementRate >= 70 ? "bg-yellow-100" : "bg-red-100"
                }`}>
                  <Award className={`h-6 w-6 ${
                    data.summary.yearlyAchievementRate >= 100 ? "text-green-600" :
                    data.summary.yearlyAchievementRate >= 70 ? "text-yellow-600" : "text-red-600"
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">年間達成率</p>
                  <p className="text-2xl font-bold">
                    {data.summary.yearlyAchievementRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 目標一覧 */}
      {data && data.goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              目標がありません
            </h3>
            <p className="text-slate-500">
              「目標追加」ボタンから売上目標を設定しましょう
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                        {periodLabels[goal.period]}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getGoalPeriodLabel(goal)}
                      </span>
                      <h3 className="font-medium">{goal.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">目標:</span>
                        <span className="ml-2 font-medium">
                          ¥{formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">実績:</span>
                        <span className="ml-2 font-medium">
                          ¥{formatCurrency(goal.actualAmount)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500">達成率:</span>
                        <span className={`ml-2 font-bold ${
                          goal.achievementRate >= 100 ? "text-green-600" :
                          goal.achievementRate >= 70 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {goal.achievementRate}%
                        </span>
                        {goal.achievementRate >= 100 ? (
                          <TrendingUp className="h-4 w-4 ml-1 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 ml-1 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(goal.achievementRate)} transition-all`}
                        style={{ width: `${Math.min(goal.achievementRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>目標を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{goal.name}」を削除します。この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
