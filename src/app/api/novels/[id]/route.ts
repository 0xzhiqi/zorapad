import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const novel = await prisma.novel.findUnique({
      where: {
        id: id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
        chapters: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(novel);
  } catch (error) {
    console.error('Error fetching novel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate that only allowed fields are being updated
    const allowedFields = ['published', 'seekPublicFeedback'];
    const updateData: { published?: boolean; seekPublicFeedback?: boolean } = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === 'boolean') {
        updateData[key as keyof typeof updateData] = value;
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if novel exists first
    const existingNovel = await prisma.novel.findUnique({
      where: { id },
    });

    if (!existingNovel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      );
    }

    // Update the novel
    const updatedNovel = await prisma.novel.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
        chapters: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedNovel);
  } catch (error) {
    console.error('Error updating novel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}