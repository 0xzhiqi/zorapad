import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, highlightedText, startOffset, endOffset, chapterId, textLength } = await request.json();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if comment already exists for this text selection
    const existingComment = await prisma.comment.findUnique({
      where: {
        chapterId_startOffset_endOffset: {
          chapterId,
          startOffset,
          endOffset,
        },
      },
    });

    if (existingComment) {
      return NextResponse.json(
        {
          error: 'Comment already exists for this text selection',
          existingCommentId: existingComment.id,
        },
        { status: 409 }
      );
    }

    // Get chapter to check if user is the author
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: { include: { author: true } } },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const isAuthorComment = chapter.novel.author.id === session.user.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        highlightedText,
        startOffset,
        endOffset,
        textLength, // Add the missing textLength field
        isAuthorComment,
        chapterId,
        userId: user.id,
      },
      include: {
        user: true,
        replies: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { chapterId },
      include: {
        user: true,
        replies: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
