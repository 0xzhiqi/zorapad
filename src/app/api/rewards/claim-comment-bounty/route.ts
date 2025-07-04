import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { commentId, transactionHash } = await request.json();

    if (!commentId || !transactionHash) {
      return NextResponse.json(
        { error: 'Comment ID and transaction hash are required' },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        claimed: true,
      },
    });

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment claim status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}