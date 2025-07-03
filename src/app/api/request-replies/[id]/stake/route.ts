import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: replyId } = params;
    const body = await request.json();
    // Fix: Change 'stakeAmount' to 'amount' to match frontend
    const { amount, transactionHash, submissionId } = body;

    // Create stake record
    const stake = await prisma.replyStake.create({
      data: {
        replyId,
        userId: session.user.id,
        stakeAmount: amount, // Use 'amount' from request body
        transactionHash,
        submissionId, // This will be undefined, but that's OK since it's optional
        contractConfirmed: true,
      },
    });

    return NextResponse.json({ success: true, stake });
  } catch (error) {
    console.error('Error processing stake:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
