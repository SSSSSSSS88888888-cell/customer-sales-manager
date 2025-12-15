import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
}

// GET: ユーザーのチーム一覧取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 自分がオーナーまたはメンバーのチームを取得
    const teams = await prisma.team.findMany({
      where: {
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
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 各チームでの自分の権限を追加
    const teamsWithRole = teams.map((team: Team) => {
      const membership = team.members.find((m: TeamMember) => m.userId === session.user.id);
      const myRole = team.ownerId === session.user.id ? "OWNER" : membership?.role || "VIEWER";
      return { ...team, myRole };
    });

    return NextResponse.json(teamsWithRole);
  } catch (error) {
    console.error("チーム取得エラー:", error);
    return NextResponse.json(
      { error: "チームの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: チーム作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "チーム名は必須です" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("チーム作成エラー:", error);
    return NextResponse.json(
      { error: "チームの作成に失敗しました" },
      { status: 500 }
    );
  }
}
