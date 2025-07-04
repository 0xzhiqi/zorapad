import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { replyId, transactionHash } = await request.json();

    if (!replyId || !transactionHash) {
      return NextResponse.json(
        { error: 'Reply ID and transaction hash are required' },
        { status: 400 }
      );
    }

    const updatedReply = await prisma.reply.update({
      where: {
        id: replyId,
      },
      data: {
        claimed: true,
      },
    });

    return NextResponse.json({ success: true, reply: updatedReply });
  } catch (error) {
    console.error('Error updating reply claim status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}