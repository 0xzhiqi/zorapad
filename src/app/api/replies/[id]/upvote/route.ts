import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: replyId } = await params;
    const body = await request.json();
    const { type } = body;

    if (type === 'upvote') {
      // CORRECT: Use CommentUpvote for Reply upvotes (replyId field)
      const existingUpvote = await prisma.commentUpvote.findUnique({
        where: {
          replyId_userId: {
            replyId,
            userId: session.user.id,
          },
        },
      });

      if (existingUpvote) {
        return NextResponse.json({ error: 'Already upvoted' }, { status: 400 });
      }

      // CORRECT: Use CommentUpvote for Reply upvotes (replyId field)
      const upvote = await prisma.commentUpvote.create({
        data: {
          replyId,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ success: true, upvote });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing reply upvote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
