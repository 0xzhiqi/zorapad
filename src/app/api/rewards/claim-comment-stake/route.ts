import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { stakeId, transactionHash } = await request.json();

    if (!stakeId || !transactionHash) {
      return NextResponse.json(
        { error: 'Stake ID and transaction hash are required' },
        { status: 400 }
      );
    }

    // Update the comment stake to mark as claimed
    const updatedStake = await prisma.commentStake.update({
      where: {
        id: stakeId,
      },
      data: {
        claimed: true,
        claimTransactionHash: transactionHash,
        contractConfirmed: true,
      },
    });

    return NextResponse.json({ success: true, stake: updatedStake });
  } catch (error) {
    console.error('Error updating comment stake claim status:', error);
    return NextResponse.json({ error: 'Failed to update comment stake claim status' }, { status: 500 });
  }
}