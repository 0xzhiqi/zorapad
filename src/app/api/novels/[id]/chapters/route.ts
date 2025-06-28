import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bucket } from '@/lib/google-cloud-storage-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify the novel belongs to the user
    const novel = await prisma.novel.findFirst({
      where: {
        id: id,
        authorId: session.user.id,
      },
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        novelId: id,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await request.json();

    // Verify the novel belongs to the user
    const novel = await prisma.novel.findFirst({
      where: {
        id: id,
        authorId: session.user.id,
      },
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    }

    // Get the next order number
    const lastChapter = await prisma.chapter.findFirst({
      where: {
        novelId: id,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = (lastChapter?.order || 0) + 1;

    // Create chapter first
    const chapter = await prisma.chapter.create({
      data: {
        title: title || `Chapter ${nextOrder}`,
        order: nextOrder,
        novelId: id,
        contentUrl: '',
        contentPath: '',
        wordCount: 0,
        published: false,
      },
    });

    // If content is provided, save it to GCS
    if (content && content.trim()) {
      try {
        // Create content data with metadata
        const contentData = {
          content: content,
          lastModified: new Date().toISOString(),
          chapterId: chapter.id,
          version: '1.0'
        };

        // Define file path in GCS
        const contentPath = `chapters/${chapter.id}/content.json`;
        const file = bucket.file(contentPath);

        // Save content to Google Cloud Storage as JSON
        await file.save(JSON.stringify(contentData, null, 2), {
          metadata: {
            contentType: 'application/json',
            metadata: {
              chapterId: chapter.id,
              authorId: session.user.id,
              lastModified: new Date().toISOString()
            }
          }
        });

        // Generate public URL
        const contentUrl = `https://storage.googleapis.com/${bucket.name}/${contentPath}`;

        // Calculate word count
        const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const wordCount = plainText ? plainText.split(/\s+/).length : 0;

        // Update chapter with GCS info
        const updatedChapter = await prisma.chapter.update({
          where: {
            id: chapter.id,
          },
          data: {
            wordCount,
            contentUrl,
            contentPath,
          },
        });

        return NextResponse.json(updatedChapter, { status: 201 });
      } catch (gcsError) {
        console.error('Error saving to GCS:', gcsError);
        // Return the chapter even if GCS fails
        return NextResponse.json(chapter, { status: 201 });
      }
    }

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
