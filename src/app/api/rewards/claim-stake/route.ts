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

    // Update the reply stake to mark as claimed
    // Update the prisma update call around line 16
    const updatedStake = await prisma.replyStake.update({
      where: {
        id: stakeId,
      },
      data: {
        claimed: true,
        transactionHash: transactionHash,
        contractConfirmed: true, // Add this line
      },
    });

    return NextResponse.json({ success: true, stake: updatedStake });
  } catch (error) {
    console.error('Error updating stake claim status:', error);
    return NextResponse.json({ error: 'Failed to update stake claim status' }, { status: 500 });
  }
}
