'use server';

import { prisma } from '@/lib/prisma';

interface CreateInitialNovelData {
  title: string;
  coinName: string;
  coinSymbol: string;
  seekPublicFeedback: boolean;
  owners: string;
  payoutRecipient: string;
  walletAddress: string;
}

interface UpdateNovelWithCoinData {
  novelId: string;
  coinAddress: string;
  coinTransactionHash: string;
}

interface UpdateNovelWithContractData {
  novelId: string;
  coinAddress: string;
  coinTransactionHash: string;
  novelAddress: string;
  novelContractTransactionHash: string;
}

// Step 1: Create initial novel entry in database
export async function createInitialNovel(data: CreateInitialNovelData) {
  try {
    if (!data.walletAddress) {
      throw new Error('Wallet address is required');
    }

    // Find or create user by wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress: data.walletAddress.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: data.walletAddress.toLowerCase(),
          name: `User ${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}`,
        },
      });
    }

    const novel = await prisma.novel.create({
      data: {
        title: data.title,
        coinName: data.coinName,
        coinSymbol: data.coinSymbol,
        seekPublicFeedback: data.seekPublicFeedback,
        owners: data.owners,
        payoutRecipient: data.payoutRecipient,
        authorId: user.id,
        // coinAddress, novelAddress, and transaction hashes will be null initially
      },
    });

    return { success: true, novel };
  } catch (error) {
    console.error('Error creating initial novel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create novel',
    };
  }
}

// Step 3: Update novel with coin details after successful coin creation (legacy function - keep for compatibility)
export async function updateNovelWithCoin(data: UpdateNovelWithCoinData) {
  try {
    const novel = await prisma.novel.update({
      where: { id: data.novelId },
      data: {
        coinAddress: data.coinAddress,
        coinTransactionHash: data.coinTransactionHash,
      },
    });

    return { success: true, novel };
  } catch (error) {
    console.error('Error updating novel with coin details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update novel',
    };
  }
}

// Step 4: Update novel with both coin and contract details after successful deployments
export async function updateNovelWithContract(data: UpdateNovelWithContractData) {
  try {
    const novel = await prisma.novel.update({
      where: { id: data.novelId },
      data: {
        coinAddress: data.coinAddress,
        coinTransactionHash: data.coinTransactionHash,
        novelAddress: data.novelAddress,
        novelContractTransactionHash: data.novelContractTransactionHash,
      },
    });

    return { success: true, novel };
  } catch (error) {
    console.error('Error updating novel with contract details:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update novel with contract details',
    };
  }
}

// Delete novel if deployment fails
export async function deleteNovel(novelId: string) {
  try {
    await prisma.novel.delete({
      where: { id: novelId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting novel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete novel',
    };
  }
}

// Keep the original function for backward compatibility
export async function createNovel(data: any) {
  // This function is kept for backward compatibility but won't be used in the new flow
  return { success: false, error: 'Use the new 4-step process instead' };
}
