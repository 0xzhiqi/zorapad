import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all published novels with their first chapter
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
          select: {
            id: true,
            title: true,
            order: true,
            wordCount: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1, // Get only the first chapter
        },
      },
    });

    // Filter novels that have at least one published chapter
    const novelsWithChapters = allNovels.filter((novel) => novel.chapters.length > 0);

    // Shuffle and take 4 random novels
    const shuffled = novelsWithChapters.sort(() => 0.5 - Math.random());
    const randomNovels = shuffled.slice(0, 4);

    // Return novels with chapter IDs for separate content fetching
    const novelsWithPreview = randomNovels.map((novel) => {
      const firstChapter = novel.chapters[0];

      return {
        id: novel.id,
        title: novel.title,
        authorName: novel.author.name || 'Anonymous',
        chapterId: firstChapter.id, // This will be used to fetch content via /api/chapters/[id]/content
        preview: `${novel.title} - ${firstChapter.title}`, // Fallback preview
      };
    });

    return NextResponse.json(novelsWithPreview);
  } catch (error) {
    console.error('Error fetching trending novels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
