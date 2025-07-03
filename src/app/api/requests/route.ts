import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const requests = await prisma.request.findMany({
      where: {
        chapterId: chapterId,
      },
      include: {
        user: true,
        replies: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        startOffset: 'asc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      content,
      highlightedText,
      startOffset,
      endOffset,
      textLength,
      bountyAmount,
      stakersReward,
      chapterId,
    } = await request.json();

    // Verify the user is the author of the novel
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (chapter.novel.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the author can create requests' }, { status: 403 });
    }

    // Check if a request already exists at this position
    const existingRequest = await prisma.request.findUnique({
      where: {
        chapterId_startOffset_endOffset: {
          chapterId,
          startOffset,
          endOffset,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A request already exists at this position' },
        { status: 409 }
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        content,
        highlightedText,
        startOffset,
        endOffset,
        textLength,
        bountyAmount,
        stakersReward,
        chapterId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
