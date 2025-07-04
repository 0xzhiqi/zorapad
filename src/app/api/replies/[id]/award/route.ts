import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: replyId } = await params;
    const body = await request.json();
    const { bountyAmount, stakersReward, transactionHash, winnerWalletAddress } = body;

    // Verify the user is the author of the novel
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: {
        comment: {
          include: {
            chapter: {
              include: {
                novel: {
                  include: {
                    author: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!reply || reply.comment.chapter.novel.author.id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - not the author' }, { status: 403 });
    }

    // Update the reply directly with award information
    const updatedReply = await prisma.reply.update({
      where: { id: replyId },
      data: {
        bountyAmount,
        stakersReward,
        awardTransactionHash: transactionHash,
      },
    });

    return NextResponse.json({ success: true, updatedReply });
  } catch (error) {
    console.error('Error processing reply award:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}