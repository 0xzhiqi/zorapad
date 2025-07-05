import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stakes = await prisma.revenueStaking.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            coinSymbol: true,
            novelAddress: true,
          },
        },
      },
    });

    return NextResponse.json(stakes);
  } catch (error) {
    console.error('Failed to fetch stakes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
