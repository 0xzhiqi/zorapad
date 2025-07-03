import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: replyId } = await params;

    // Get upvote count and stake stats
    const [upvoteCount, stakes] = await Promise.all([
      prisma.replyUpvote.count({
        where: { replyId },
      }),
      prisma.replyStake.findMany({
        where: { replyId, contractConfirmed: true },
        select: { stakeAmount: true },
      }),
    ]);

    const totalStaked = stakes.reduce((sum, stake) => {
      return sum + BigInt(stake.stakeAmount);
    }, BigInt(0));

    return NextResponse.json({
      upvotes: upvoteCount,  // Also fixed the field name from upvoteCount to upvotes
      stakeCount: stakes.length,
      totalStaked: totalStaked.toString(),
    });
  } catch (error) {
    console.error('Error fetching reply stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}