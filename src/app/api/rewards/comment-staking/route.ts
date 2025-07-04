import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find comment stakes where user has staked and comment has been awarded
    const commentStakes = await prisma.commentStake.findMany({
      where: {
        userId: userId,
        commentId: { not: null },
        comment: {
          awardTransactionHash: { not: null },
          stakersReward: { not: null }
        }
      },
      include: {
        comment: {
          include: {
            chapter: {
              include: {
                novel: {
                  select: {
                    title: true,
                    coinName: true,
                    coinSymbol: true,
                    novelAddress: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Find reply stakes where user has staked and reply has been awarded
    const replyStakes = await prisma.commentStake.findMany({
      where: {
        userId: userId,
        replyId: { not: null },
        reply: {
          awardTransactionHash: { not: null },
          stakersReward: { not: null }
        }
      },
      include: {
        reply: {
          include: {
            comment: {
              include: {
                chapter: {
                  include: {
                    novel: {
                      select: {
                        title: true,
                        coinName: true,
                        coinSymbol: true,
                        novelAddress: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform comment stakes
    const transformedCommentStakes = commentStakes.map((stake) => ({
      id: stake.id,
      stakeAmount: stake.stakeAmount,
      stakersReward: stake.comment?.stakersReward || '0',
      claimed: stake.claimed,
      claimTransactionHash: stake.claimTransactionHash,
      itemId: stake.commentId,
      itemType: 'comment' as const,
      novel: {
        title: stake.comment?.chapter.novel.title || '',
        coinName: stake.comment?.chapter.novel.coinName || '',
        coinSymbol: stake.comment?.chapter.novel.coinSymbol || '',
        novelAddress: stake.comment?.chapter.novel.novelAddress
      }
    }));

    // Transform reply stakes
    const transformedReplyStakes = replyStakes.map((stake) => ({
      id: stake.id,
      stakeAmount: stake.stakeAmount,
      stakersReward: stake.reply?.stakersReward || '0',
      claimed: stake.claimed,
      claimTransactionHash: stake.claimTransactionHash,
      itemId: stake.replyId,
      itemType: 'reply' as const,
      novel: {
        title: stake.reply?.comment.chapter.novel.title || '',
        coinName: stake.reply?.comment.chapter.novel.coinName || '',
        coinSymbol: stake.reply?.comment.chapter.novel.coinSymbol || '',
        novelAddress: stake.reply?.comment.chapter.novel.novelAddress
      }
    }));

    // Combine and return both types
    const allStakes = [...transformedCommentStakes, ...transformedReplyStakes];

    return NextResponse.json(allStakes);
  } catch (error) {
    console.error('Error fetching comment bounty staking rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch comment bounty staking rewards' }, { status: 500 });
  }
}