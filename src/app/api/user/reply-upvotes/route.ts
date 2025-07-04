import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get regular reply upvotes
    const upvotes = await prisma.commentUpvote.findMany({
      where: {
        userId: session.user.id,
        replyId: { not: null }, // Only get reply upvotes, not comment upvotes
      },
      select: {
        replyId: true,
      },
    });

    // Get staked replies (stake upvotes should also show "Voted")
    const stakes = await prisma.commentStake.findMany({
      where: {
        userId: session.user.id,
        replyId: { not: null }, // Only get reply stakes, not comment stakes
      },
      select: {
        replyId: true,
      },
    });

    // Combine upvotes and stakes
    const upvotedReplyIds = upvotes
      .map(upvote => upvote.replyId)
      .filter((id): id is string => id !== null);
    
    const stakedReplyIds = stakes
      .map(stake => stake.replyId)
      .filter((id): id is string => id !== null);

    // Remove duplicates using Set
    const allReplyIds = [...new Set([...upvotedReplyIds, ...stakedReplyIds])];
    
    return NextResponse.json(allReplyIds);
  } catch (error) {
    console.error('Error fetching user reply upvotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}