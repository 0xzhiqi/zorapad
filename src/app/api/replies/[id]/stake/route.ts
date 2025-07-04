import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: replyId } = await params;
    const body = await request.json();
    const { amount, transactionHash } = body;

    // Create stake record
    const stake = await prisma.commentStake.create({
      data: {
        replyId,
        userId: session.user.id,
        stakeAmount: amount,
        transactionHash,
        contractConfirmed: true,
      },
    });

    return NextResponse.json({ success: true, stake });
  } catch (error) {
    console.error('Error processing reply stake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}