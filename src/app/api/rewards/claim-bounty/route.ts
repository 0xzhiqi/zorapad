import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { requestId, transactionHash } = await request.json();

    if (!requestId || !transactionHash) {
      return NextResponse.json(
        { error: 'Request ID and transaction hash are required' },
        { status: 400 }
      );
    }

    // Update the request to mark bounty as claimed
    const updatedRequest = await prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        claimed: true,
        transactionHash: transactionHash,
      },
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Error updating bounty claim status:', error);
    return NextResponse.json({ error: 'Failed to update bounty claim status' }, { status: 500 });
  }
}
