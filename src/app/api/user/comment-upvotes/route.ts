import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get regular upvotes
    const upvotes = await prisma.commentUpvote.findMany({
      where: {
        userId: session.user.id,
        commentId: { not: null }, // Only get comment upvotes, not reply upvotes
      },
      select: {
        commentId: true,
      },
    });

    // Get staked comments (stake upvotes should also show "Voted")
    const stakes = await prisma.commentStake.findMany({
      where: {
        userId: session.user.id,
        commentId: { not: null }, // Only get comment stakes, not reply stakes
      },
      select: {
        commentId: true,
      },
    });

    // Combine upvotes and stakes
    const upvotedCommentIds = upvotes
      .map(upvote => upvote.commentId)
      .filter((id): id is string => id !== null);
    
    const stakedCommentIds = stakes
      .map(stake => stake.commentId)
      .filter((id): id is string => id !== null);

    // Remove duplicates using Set
    const allCommentIds = [...new Set([...upvotedCommentIds, ...stakedCommentIds])];
    
    return NextResponse.json(allCommentIds);
  } catch (error) {
    console.error('Error fetching user comment upvotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}