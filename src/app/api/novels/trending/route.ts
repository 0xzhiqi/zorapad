import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bucket } from '@/lib/google-cloud-storage-client';

export async function GET(request: NextRequest) {
  try {
    // Fetch all published novels
    const allNovels = await prisma.novel.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            contentPath: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1, // Get only the first chapter
        },
      },
    });

    // Shuffle and take 4 random novels
    const shuffled = allNovels.sort(() => 0.5 - Math.random());
    const randomNovels = shuffled.slice(0, 4);

    // Fetch content for each novel's first chapter
    const novelsWithContent = await Promise.all(
      randomNovels.map(async (novel) => {
        let firstChapterContent = '';
        
        if (novel.chapters.length > 0 && novel.chapters[0].contentPath) {
          try {
            const file = bucket.file(novel.chapters[0].contentPath);
            const [content] = await file.download();
            const fullContent = content.toString('utf-8');
            
            // Get first 100 characters
            firstChapterContent = fullContent.length > 100 
              ? fullContent.substring(0, 100) + '...'
              : fullContent;
          } catch (error) {
            console.error(`Error fetching content for chapter ${novel.chapters[0].id}:`, error);
            firstChapterContent = 'Content not available...';
          }
        }

        return {
          id: novel.id,
          title: novel.title,
          authorName: novel.author.name || 'Anonymous',
          preview: firstChapterContent,
        };
      })
    );

    return NextResponse.json(novelsWithContent);
  } catch (error) {
    console.error('Error fetching trending novels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}