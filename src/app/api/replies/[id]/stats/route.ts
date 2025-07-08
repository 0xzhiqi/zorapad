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
        isAwarded: false,
      });
    }

    // Get reply with award information
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      select: {
        bountyAmount: true,
        stakersReward: true,
        awardTransactionHash: true,
      },
    });

    // Get upvote count, stake count, and stake stats
    const [upvoteCount, stakeCount, stakes] = await Promise.all([
      prisma.commentUpvote.count({
        where: { replyId },
      }),
      prisma.commentStake.count({
        where: { replyId, contractConfirmed: true },
      }),
      prisma.commentStake.findMany({
        where: { replyId, contractConfirmed: true },
        select: { stakeAmount: true },
      }),
    ]);

    const totalStaked = stakes.reduce((sum, stake) => {
      return sum + BigInt(stake.stakeAmount);
    }, BigInt(0));

    // Total upvotes = regular upvotes + stake upvotes
    const totalUpvotes = upvoteCount + stakeCount;

    // Check if reply is awarded
    const isAwarded = !!reply?.awardTransactionHash;

    return NextResponse.json({
      upvotes: totalUpvotes,
      stakeCount: stakeCount,
      totalStaked: totalStaked.toString(),
      bountyAmount: reply?.bountyAmount ? parseFloat(reply.bountyAmount) : undefined,
      stakersReward: reply?.stakersReward ? parseFloat(reply.stakersReward) : undefined,
      isAwarded,
    });
  } catch (error) {
    console.error('Error fetching reply stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
