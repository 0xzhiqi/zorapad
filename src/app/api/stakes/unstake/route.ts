import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stakeId } = await req.json();

    if (!stakeId) {
      return NextResponse.json({ error: 'Stake ID is required' }, { status: 400 });
    }

    const updatedStake = await prisma.revenueStaking.update({
      where: {
        id: stakeId,
        userId: session.user.id, // Ensure user can only update their own stake
      },
      data: {
        unstaked: true,
        // You would also add the unstakeTransactionHash here once you have it
      },
    });

    return NextResponse.json(updatedStake);
  } catch (error) {
    console.error('Failed to unstake:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
