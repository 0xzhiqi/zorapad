import { getCoin } from '@zoralabs/coins-sdk';
import { NextResponse } from 'next/server';
import { baseSepolia } from 'viem/chains';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by id
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's novels
    const novels = await prisma.novel.findMany({
      where: {
        authorId: user.id,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch coin data for novels with coinAddress
    const novelsWithCoinData = await Promise.all(
      novels.map(async (novel) => {
        let coinData = null;

        if (novel.coinAddress) {
          try {
            const response = await getCoin({
              address: novel.coinAddress,
              chain: baseSepolia.id,
            });

            const coin = response.data?.zora20Token;
            if (coin) {
              coinData = {
                marketCap: coin.marketCap,
                volume24h: coin.volume24h,
                uniqueHolders: coin.uniqueHolders,
              };
            }
          } catch (error) {
            console.error(`Error fetching coin data for ${novel.coinAddress}:`, error);
          }
        }

        return {
          ...novel,
          coinData,
        };
      })
    );

    return NextResponse.json(novelsWithCoinData);
  } catch (error) {
    console.error('Error fetching user novels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
