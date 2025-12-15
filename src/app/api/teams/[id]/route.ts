import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
}

// GET: チーム詳細取得
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

    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "チームが見つかりません" },
        { status: 404 }
      );
    }

    // 自分の権限を追加
    const membership = team.members.find((m: TeamMember) => m.userId === session.user.id);
    const myRole = team.ownerId === session.user.id ? "OWNER" : membership?.role || "VIEWER";

    return NextResponse.json({ ...team, myRole });
  } catch (error) {
    console.error("チーム取得エラー:", error);
    return NextResponse.json(
      { error: "チームの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: チーム更新
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
    const { name, description } = body;

    // 権限確認（オーナーまたは管理者のみ）
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
    const membership = team.members[0];
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "チームを編集する権限がありません" },
        { status: 403 }
      );
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: name || team.name,
        description: description !== undefined ? description : team.description,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("チーム更新エラー:", error);
    return NextResponse.json(
      { error: "チームの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: チーム削除
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

    // オーナーのみ削除可能
    const team = await prisma.team.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!team) {
      return NextResponse.json(
        { error: "チームが見つからないか、削除権限がありません" },
        { status: 404 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ message: "チームを削除しました" });
  } catch (error) {
    console.error("チーム削除エラー:", error);
    return NextResponse.json(
      { error: "チームの削除に失敗しました" },
      { status: 500 }
    );
  }
}
