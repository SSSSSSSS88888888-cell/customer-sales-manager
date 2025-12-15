"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Settings,
  Copy,
  UserPlus,
  LogOut,
  Trash2,
  Crown,
  Shield,
  User,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  members: TeamMember[];
  myRole: string;
}

const roleLabels: Record<string, string> = {
  OWNER: "オーナー",
  ADMIN: "管理者",
  MEMBER: "メンバー",
  VIEWER: "閲覧者",
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  // フォーム状態
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("チームの取得に失敗しました");
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "チームの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "エラー",
        description: "チーム名を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription || null,
        }),
      });

      if (!res.ok) throw new Error("チームの作成に失敗しました");

      toast({
        title: "成功",
        description: "チームを作成しました",
      });

      setNewTeamName("");
      setNewTeamDescription("");
      setIsCreateOpen(false);
      fetchTeams();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "チームの作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "エラー",
        description: "招待コードを入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "チームへの参加に失敗しました");

      toast({
        title: "成功",
        description: `「${data.team.name}」に参加しました`,
      });

      setInviteCode("");
      setIsJoinOpen(false);
      fetchTeams();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "チームへの参加に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "コピーしました",
        description: "招待コードをクリップボードにコピーしました",
      });
    } catch {
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("チームの削除に失敗しました");

      toast({
        title: "成功",
        description: "チームを削除しました",
      });

      setIsDetailOpen(false);
      setSelectedTeam(null);
      fetchTeams();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "チームの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleLeaveTeam = async (teamId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("チームからの退出に失敗しました");

      toast({
        title: "成功",
        description: "チームから退出しました",
      });

      setIsDetailOpen(false);
      setSelectedTeam(null);
      fetchTeams();
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "チームからの退出に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleChangeMemberRole = async (teamId: string, memberId: string, role: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });

      if (!res.ok) throw new Error("権限の変更に失敗しました");

      toast({
        title: "成功",
        description: "メンバーの権限を変更しました",
      });

      // チーム詳細を再取得
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setSelectedTeam(teamData);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "権限の変更に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("メンバーの削除に失敗しました");

      toast({
        title: "成功",
        description: "メンバーを削除しました",
      });

      // チーム詳細を再取得
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setSelectedTeam(teamData);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "エラー",
        description: "メンバーの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const openTeamDetail = async (team: Team) => {
    try {
      const res = await fetch(`/api/teams/${team.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTeam(data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error(error);
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
          <h1 className="text-2xl font-bold text-slate-900">チーム管理</h1>
          <p className="text-slate-500">チームを作成して共同編集しましょう</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                チームに参加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>チームに参加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="inviteCode">招待コード</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="招待コードを入力"
                  />
                </div>
                <Button onClick={handleJoinTeam} className="w-full">
                  参加する
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                チーム作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいチームを作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="teamName">チーム名 *</Label>
                  <Input
                    id="teamName"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="例: 経理チーム"
                  />
                </div>
                <div>
                  <Label htmlFor="teamDescription">説明</Label>
                  <Textarea
                    id="teamDescription"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="チームの説明（任意）"
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateTeam} className="w-full">
                  作成する
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              まだチームがありません
            </h3>
            <p className="text-slate-500 mb-4">
              チームを作成するか、招待コードでチームに参加しましょう
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const RoleIcon = roleIcons[team.myRole] || User;
            return (
              <Card
                key={team.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openTeamDetail(team)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <RoleIcon className="h-4 w-4" />
                      <span>{roleLabels[team.myRole]}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                    {team.description || "説明なし"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-500">
                      <Users className="h-4 w-4 mr-1" />
                      {team.members.length + 1}人
                    </div>
                    <div className="text-slate-400">
                      オーナー: {team.owner.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* チーム詳細ダイアログ */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {selectedTeam.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* 基本情報 */}
                <div>
                  <h4 className="font-medium mb-2">チーム情報</h4>
                  <p className="text-sm text-slate-500">
                    {selectedTeam.description || "説明なし"}
                  </p>
                </div>

                {/* 招待コード */}
                {(selectedTeam.myRole === "OWNER" || selectedTeam.myRole === "ADMIN") && (
                  <div>
                    <h4 className="font-medium mb-2">招待コード</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        value={selectedTeam.inviteCode}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyInviteCode(selectedTeam.inviteCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      このコードを共有してメンバーを招待できます
                    </p>
                  </div>
                )}

                {/* メンバー一覧 */}
                <div>
                  <h4 className="font-medium mb-2">メンバー</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名前</TableHead>
                        <TableHead>メール</TableHead>
                        <TableHead>権限</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* オーナー */}
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            {selectedTeam.owner.name}
                          </div>
                        </TableCell>
                        <TableCell>{selectedTeam.owner.email}</TableCell>
                        <TableCell>オーナー</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                      {/* メンバー */}
                      {selectedTeam.members
                        .filter(m => m.user.id !== selectedTeam.ownerId)
                        .map((member) => {
                          const canManage = selectedTeam.myRole === "OWNER" || selectedTeam.myRole === "ADMIN";
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.user.name}
                              </TableCell>
                              <TableCell>{member.user.email}</TableCell>
                              <TableCell>
                                {canManage ? (
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) =>
                                      handleChangeMemberRole(selectedTeam.id, member.id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ADMIN">管理者</SelectItem>
                                      <SelectItem value="MEMBER">メンバー</SelectItem>
                                      <SelectItem value="VIEWER">閲覧者</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  roleLabels[member.role]
                                )}
                              </TableCell>
                              <TableCell>
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>

                {/* アクションボタン */}
                <div className="flex justify-between pt-4 border-t">
                  {selectedTeam.myRole === "OWNER" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          チームを削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>チームを削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。チームとすべてのメンバーシップが削除されます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTeam(selectedTeam.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          <LogOut className="h-4 w-4 mr-2" />
                          チームを退出
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>チームを退出しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            再度参加するには招待コードが必要になります。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const myMembership = selectedTeam.members.find(
                                m => m.role === selectedTeam.myRole
                              );
                              if (myMembership) {
                                handleLeaveTeam(selectedTeam.id, myMembership.id);
                              }
                            }}
                          >
                            退出する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    閉じる
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
