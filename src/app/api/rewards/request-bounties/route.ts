import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const requestBounties = await prisma.request.findMany({
      where: {
        winnerId: userId,
      },
      include: {
        chapter: {
          include: {
            novel: {
              select: {
                coinAddress: true,
                novelAddress: true, // Add this line
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requestBounties);
  } catch (error) {
    console.error('Error fetching request bounties:', error);
    return NextResponse.json({ error: 'Failed to fetch request bounties' }, { status: 500 });
  }
}
