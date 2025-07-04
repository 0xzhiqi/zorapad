import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to validate MongoDB ObjectID
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: commentId } = await params;

    // Skip database queries for temporary IDs
    if (!isValidObjectId(commentId)) {
      return NextResponse.json({
        upvotes: 0,
        stakeCount: 0,
        totalStaked: '0',
      });
    }

    // Get upvote count, stake count, and stake stats
    const [upvoteCount, stakeCount, stakes] = await Promise.all([
      prisma.commentUpvote.count({
        where: { commentId },
      }),
      prisma.commentStake.count({
        where: { commentId, contractConfirmed: true },
      }),
      prisma.commentStake.findMany({
        where: { commentId, contractConfirmed: true },
        select: { stakeAmount: true },
      }),
    ]);

    const totalStaked = stakes.reduce((sum, stake) => {
      return sum + BigInt(stake.stakeAmount);
    }, BigInt(0));

    // Total upvotes = regular upvotes + stake upvotes
    const totalUpvotes = upvoteCount + stakeCount;

    return NextResponse.json({
      upvotes: totalUpvotes,
      stakeCount: stakeCount,
      totalStaked: totalStaked.toString(),
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}