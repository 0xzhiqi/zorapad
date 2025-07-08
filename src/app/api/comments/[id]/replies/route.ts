import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    const { id: commentId } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reply = await prisma.reply.create({
      data: {
        content,
        commentId,
        userId: user.id,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
