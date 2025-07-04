import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const commentBounties = await prisma.comment.findMany({
      where: {
        userId: userId,
        awardTransactionHash: {
          not: null,
        },
        bountyAmount: {
          not: null,
        },
      },
      include: {
        chapter: {
          include: {
            novel: {
              select: {
                title: true,           // Add this line
                coinSymbol: true,      // Add this line
                novelAddress: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(commentBounties);
  } catch (error) {
    console.error('Error fetching comment bounties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}