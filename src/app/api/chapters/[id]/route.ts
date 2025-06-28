import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: id,
        novel: {
          authorId: session.user.id,
        },
      },
      include: {
        novel: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the chapter belongs to the user
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        id: id,
        novel: {
          authorId: session.user.id,
        },
      },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.published !== undefined) updateData.published = body.published;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.wordCount !== undefined) updateData.wordCount = body.wordCount;
    if (body.contentUrl !== undefined) updateData.contentUrl = body.contentUrl;
    if (body.contentPath !== undefined) updateData.contentPath = body.contentPath;

    const chapter = await prisma.chapter.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify the chapter belongs to the user
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: id,
        novel: {
          authorId: session.user.id,
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // TODO: Delete content from Google Cloud Storage if contentUrl exists
    // if (chapter.contentUrl) {
    //   await deleteFromGCS(chapter.contentPath);
    // }

    await prisma.chapter.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
