import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// TeamRole を文字列リテラルとして定義
type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
const validRoles: TeamRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

// GET: チームメンバー一覧取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    // チームメンバーか確認
    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "チームが見つからないか、アクセス権限がありません" },
        { status: 404 }
      );
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("メンバー取得エラー:", error);
    return NextResponse.json(
      { error: "メンバーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: メンバー権限変更
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "メンバーIDと権限は必須です" },
        { status: 400 }
      );
    }

    // 有効な権限か確認
    if (!validRoles.includes(role as TeamRole)) {
      return NextResponse.json(
        { error: "無効な権限です" },
        { status: 400 }
      );
    }

    // オーナーまたは管理者か確認
    const team = await prisma.team.findFirst({
      where: { id },
      include: {
        members: { where: { userId: session.user.id } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "チームが見つかりません" },
        { status: 404 }
      );
    }

    const isOwner = team.ownerId === session.user.id;
    const currentMembership = team.members[0];
    const isAdmin = currentMembership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "メンバー権限を変更する権限がありません" },
        { status: 403 }
      );
    }

    // OWNERはPrismaのTeamRoleとしては設定しない（ownerId で管理）
    if (role === "OWNER") {
      return NextResponse.json(
        { error: "オーナー権限は別の方法で移譲してください" },
        { status: 400 }
      );
    }

    // オーナー自身の権限は変更できない
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "メンバーが見つかりません" },
        { status: 404 }
      );
    }

    if (targetMember.userId === team.ownerId) {
      return NextResponse.json(
        { error: "オーナーの権限は変更できません" },
        { status: 400 }
      );
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("権限変更エラー:", error);
    return NextResponse.json(
      { error: "権限の変更に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: メンバー削除（退出）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "メンバーIDが必要です" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findFirst({
      where: { id },
      include: {
        members: { where: { userId: session.user.id } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "チームが見つかりません" },
        { status: 404 }
      );
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.teamId !== id) {
      return NextResponse.json(
        { error: "メンバーが見つかりません" },
        { status: 404 }
      );
    }

    // オーナーは削除できない
    if (targetMember.userId === team.ownerId) {
      return NextResponse.json(
        { error: "オーナーはチームから削除できません" },
        { status: 400 }
      );
    }

    // 自分自身の退出、またはオーナー/管理者による削除のみ許可
    const isOwner = team.ownerId === session.user.id;
    const currentMembership = team.members[0];
    const isAdmin = currentMembership?.role === "ADMIN";
    const isSelf = targetMember.userId === session.user.id;

    if (!isOwner && !isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "メンバーを削除する権限がありません" },
        { status: 403 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "メンバーを削除しました" });
  } catch (error) {
    console.error("メンバー削除エラー:", error);
    return NextResponse.json(
      { error: "メンバーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
