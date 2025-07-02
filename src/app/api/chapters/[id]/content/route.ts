import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bucket } from '@/lib/google-cloud-storage-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: id,
      },
      include: {
        novel: {
          select: {
            id: true,
            authorId: true,
            published: true,
            seekPublicFeedback: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check access permissions:
    // 1. If user is the author, always allow
    // 2. If novel is published, allow anyone (even unauthenticated users)
    // 3. If novel seeks public feedback, allow authenticated users
    const isAuthor = session?.user?.id === chapter.novel.authorId;
    const isPublished = chapter.novel.published;
    const seeksFeedback = chapter.novel.seekPublicFeedback;
    
    if (!isAuthor && !isPublished && (!seeksFeedback || !session?.user?.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If no content URL, return empty content
    if (!chapter.contentUrl || !chapter.contentPath) {
      return NextResponse.json({ content: '' });
    }

    try {
      // Fetch content from Google Cloud Storage
      const file = bucket.file(chapter.contentPath);
      const [fileContents] = await file.download();
      const contentData = JSON.parse(fileContents.toString());
      
      return NextResponse.json({ content: contentData.content || '' });
    } catch (gcsError) {
      console.error('Error fetching from GCS:', gcsError);
      // If file doesn't exist or error reading, return empty content
      return NextResponse.json({ content: '' });
    }
  } catch (error) {
    console.error('Error fetching chapter content:', error);
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
    const { content } = await request.json();

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

    try {
      // Create content data with metadata
      const contentData = {
        content: content,
        lastModified: new Date().toISOString(),
        chapterId: id,
        version: '1.0'
      };

      // Define file path in GCS
      const contentPath = `chapters/${id}/content.json`;
      const file = bucket.file(contentPath);

      // Save content to Google Cloud Storage as JSON
      await file.save(JSON.stringify(contentData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            chapterId: id,
            authorId: session.user.id,
            lastModified: new Date().toISOString()
          }
        }
      });

      // Generate public URL
      const contentUrl = `https://storage.googleapis.com/${bucket.name}/${contentPath}`;

      // Calculate word count from plain text (strip HTML/formatting)
      const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = plainText ? plainText.split(/\s+/).length : 0;

      // Update chapter with GCS info
      const updatedChapter = await prisma.chapter.update({
        where: {
          id: id,
        },
        data: {
          wordCount,
          contentUrl,
          contentPath,
        },
      });

      return NextResponse.json({
        message: 'Content saved successfully',
        chapter: updatedChapter,
        contentUrl
      });
    } catch (gcsError) {
      console.error('Error saving to GCS:', gcsError);
      return NextResponse.json({ error: 'Failed to save content to storage' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving chapter content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
