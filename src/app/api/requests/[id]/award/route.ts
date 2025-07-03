import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { winningReplyId, winnerId, awardTransactionHash } = await request.json();
    const { id: requestId } = await params;

    // Verify the user is the author of the novel
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        chapter: {
          include: {
            novel: true,
          },
        },
      },
    });

    if (!requestData || requestData.chapter.novel.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the request with award information
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        isAwarded: true,
        winnerId,
        winningReplyId,
        awardTransactionHash,
        awardedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Award request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
