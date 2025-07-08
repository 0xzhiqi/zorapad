import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: replyId } = await params;
    const body = await request.json();
    const { amount, transactionHash } = body;

    // Check if user already staked
    const existingStake = await prisma.commentStake.findFirst({
      where: {
        replyId,
        userId: session.user.id,
      },
    });

    if (existingStake) {
      return NextResponse.json({ error: 'Already staked' }, { status: 400 });
    }

    // Create both stake record and upvote record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stake record
      const stake = await tx.commentStake.create({
        data: {
          replyId,
          userId: session.user.id,
          stakeAmount: amount,
          transactionHash,
          contractConfirmed: true,
        },
      });

      // Create upvote record if it doesn't exist (upsert)
      const upvote = await tx.commentUpvote.upsert({
        where: {
          replyId_userId: {
            replyId,
            userId: session.user.id,
          },
        },
        update: {}, // Don't update anything if it exists
        create: {
          replyId,
          userId: session.user.id,
        },
      });

      return { stake, upvote };
    });

    return NextResponse.json({ success: true, stake: result.stake, upvote: result.upvote });
  } catch (error) {
    console.error('Error processing reply stake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
