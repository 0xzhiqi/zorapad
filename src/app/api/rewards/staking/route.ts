import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find all awarded requests first
    const awardedRequests = await prisma.request.findMany({
      where: {
        isAwarded: true,
        winningReplyId: { not: null },
      },
      select: {
        id: true,
        winningReplyId: true,
        isAwarded: true,
        chapter: {
          include: {
            novel: {
              select: {
                title: true,           // Add this line
                coinSymbol: true,      // Add this line
                coinAddress: true,
              },
            },
          },
        },
      },
    });

    // Get winning reply IDs
    const winningReplyIds = awardedRequests
      .map((req) => req.winningReplyId)
      .filter(Boolean) as string[];

    // Find user's stakes on winning replies
    const stakingRewards = await prisma.replyStake.findMany({
      where: {
        userId: userId,
        replyId: {
          in: winningReplyIds,
        },
      },
      include: {
        reply: {
          include: {
            request: {
              include: {
                chapter: {
                  include: {
                    novel: {
                      select: {
                        title: true,           // Add this line
                        coinSymbol: true,      // Add this line
                        coinAddress: true,
                        novelAddress: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedStakes = stakingRewards.map((stake) => ({
      id: stake.id,
      stakeAmount: stake.stakeAmount,
      claimed: stake.claimed,
      replyId: stake.replyId,
      request: {
        id: stake.reply.request.id,
        isAwarded: stake.reply.request.isAwarded,
        winningReplyId: stake.reply.request.winningReplyId,
        chapter: stake.reply.request.chapter,
      },
    }));

    return NextResponse.json(transformedStakes);
  } catch (error) {
    console.error('Error fetching staking rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch staking rewards' }, { status: 500 });
  }
}
