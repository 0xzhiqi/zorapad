import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Helper function to validate MongoDB ObjectID
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: replyId } = await params;

    // Skip database queries for temporary IDs
    if (!isValidObjectId(replyId)) {
      return NextResponse.json({
        upvotes: 0,
        stakeCount: 0,
        totalStaked: '0',
      });
    }

    // Get upvote count, stake count, and stake stats
    const [upvoteCount, stakeCount, stakes] = await Promise.all([
      prisma.replyUpvote.count({
        where: { replyId },
      }),
      prisma.replyStake.count({
        where: { replyId, contractConfirmed: true },
      }),
      prisma.replyStake.findMany({
        where: { replyId, contractConfirmed: true },
        select: { stakeAmount: true },
      }),
    ]);

    const totalStaked = stakes.reduce((sum, stake) => {
      return sum + BigInt(stake.stakeAmount);
    }, BigInt(0));

    // Total upvotes = regular upvotes + stake upvotes
    const totalUpvotes = upvoteCount + stakeCount;

    return NextResponse.json({
      upvotes: totalUpvotes, // Now includes both regular upvotes and stake upvotes
      stakeCount: stakeCount,
      totalStaked: totalStaked.toString(),
    });
  } catch (error) {
    console.error('Error fetching reply stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
