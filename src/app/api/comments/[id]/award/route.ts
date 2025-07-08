import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { bountyAmount, stakersReward, transactionHash } = body;

    // Verify the user is the author of the novel
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        chapter: {
          include: {
            novel: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    if (!comment || comment.chapter.novel.author.id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - not the author' }, { status: 403 });
    }

    // Update the comment directly with award information
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        bountyAmount,
        stakersReward,
        awardTransactionHash: transactionHash,
      },
    });

    return NextResponse.json({ success: true, updatedComment });
  } catch (error) {
    console.error('Error processing comment award:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
