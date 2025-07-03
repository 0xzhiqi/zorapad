import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const replyIds = searchParams.get('replyIds')?.split(',') || [];

    if (replyIds.length === 0) {
      return NextResponse.json([]);
    }

    const upvotes = await prisma.replyUpvote.findMany({
      where: {
        userId: session.user.id,
        replyId: { in: replyIds },
      },
      select: {
        replyId: true,
      },
    });

    const upvotedReplyIds = upvotes.map(upvote => upvote.replyId);
    return NextResponse.json(upvotedReplyIds);
  } catch (error) {
    console.error('Error fetching user upvotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}