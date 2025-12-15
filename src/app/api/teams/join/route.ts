import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: 招待コードでチームに参加
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "招待コードは必須です" },
        { status: 400 }
      );
    }

    // 招待コードからチームを検索
    const team = await prisma.team.findUnique({
      where: { inviteCode },
      include: {
        members: { where: { userId: session.user.id } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "無効な招待コードです" },
        { status: 404 }
      );
    }

    // 既にメンバーか確認
    if (team.ownerId === session.user.id || team.members.length > 0) {
      return NextResponse.json(
        { error: "既にこのチームのメンバーです" },
        { status: 400 }
      );
    }

    // メンバーとして追加
    const member = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: "MEMBER",
      },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({
      message: "チームに参加しました",
      team: member.team,
    }, { status: 201 });
  } catch (error) {
    console.error("チーム参加エラー:", error);
    return NextResponse.json(
      { error: "チームへの参加に失敗しました" },
      { status: 500 }
    );
  }
}
