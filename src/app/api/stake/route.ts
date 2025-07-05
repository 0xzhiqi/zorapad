import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { novelId, amountStaked, stakeTransactionHash } = body;

    if (!novelId || !amountStaked || !stakeTransactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a stake already exists for this user and novel
    const existingStake = await prisma.revenueStaking.findFirst({
      where: {
        userId: session.user.id,
        novelId,
      },
    });

    let stake;

    if (existingStake) {
      // Update existing stake by adding the new amount
      stake = await prisma.revenueStaking.update({
        where: {
          id: existingStake.id,
        },
        data: {
          amountStaked: existingStake.amountStaked + amountStaked,
          stakeTransactionHash, // Update with latest transaction hash
        },
      });
    } else {
      // Create new stake
      stake = await prisma.revenueStaking.create({
        data: {
          userId: session.user.id,
          novelId,
          amountStaked,
          stakeTransactionHash,
        },
      });
    }

    return NextResponse.json(stake, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating stake:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
