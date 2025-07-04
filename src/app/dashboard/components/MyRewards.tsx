'use client';

import { useEffect, useState } from 'react';

import {
  Check,
  CircleCheckBig,
  Coins,
  Gift,
  HandCoins,
  Loader2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { getContract } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { keccak256, stringToBytes } from 'viem';

import { baseSepoliaChain, client } from '@/lib/thirdweb';

interface RequestBounty {
  id: string;
  bountyAmount: string;
  isAwarded: boolean;
  claimed: boolean;
  contractBountyId?: string;
  chapter: {
    novel: {
      title: string;
      coinSymbol: string;
      coinAddress?: string;
      novelAddress?: string;
    };
  };
}

interface CommentBounty {
  id: string;
  bountyAmount: string;
  awardTransactionHash: string;
  claimed: boolean;
  chapter: {
    novel: {
      title: string;
      coinSymbol: string;
      novelAddress?: string;
    };
  };
}

interface ReplyBounty {
  id: string;
  bountyAmount: string;
  awardTransactionHash: string;
  claimed?: boolean;
  comment: {
    chapter: {
      novel: {
        title: string;
        coinSymbol: string;
        novelAddress?: string;
      };
    };
  };
}

interface StakingReward {
  id: string;
  stakeAmount: string;
  claimed: boolean;
  replyId: string;
  request: {
    id: string;
    isAwarded: boolean;
    winningReplyId?: string;
    chapter: {
      novel: {
        title: string;
        coinSymbol: string;
        coinAddress?: string;
        novelAddress?: string;
      };
    };
  };
}

const MyRewards = () => {
  const { data: session } = useSession();
  const account = useActiveAccount();
  const [requestBounties, setRequestBounties] = useState<RequestBounty[]>([]);
  const [commentBounties, setCommentBounties] = useState<CommentBounty[]>([]);
  const [replyBounties, setReplyBounties] = useState<ReplyBounty[]>([]);
  const [stakingRewards, setStakingRewards] = useState<StakingReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingBounty, setClaimingBounty] = useState<string | null>(null);
  const [claimingComment, setClaimingComment] = useState<string | null>(null);
  const [claimingReply, setClaimingReply] = useState<string | null>(null);
  const [claimingStake, setClaimingStake] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch request bounties where user is the winner
        const bountyResponse = await fetch(
          `/api/rewards/request-bounties?userId=${session.user.id}`
        );
        if (bountyResponse.ok) {
          const bounties = await bountyResponse.json();
          setRequestBounties(bounties);
        }

        // Fetch comment bounties where user is the author and bounty is awarded
        const commentResponse = await fetch(
          `/api/rewards/comment-bounties?userId=${session.user.id}`
        );
        if (commentResponse.ok) {
          const comments = await commentResponse.json();
          setCommentBounties(comments);
        }

        // Fetch reply bounties where user is the author and bounty is awarded
        const replyResponse = await fetch(`/api/rewards/reply-bounties?userId=${session.user.id}`);
        if (replyResponse.ok) {
          const replies = await replyResponse.json();
          setReplyBounties(replies);
        }

        // Fetch staking rewards
        const stakingResponse = await fetch(`/api/rewards/staking?userId=${session.user.id}`);
        if (stakingResponse.ok) {
          const stakes = await stakingResponse.json();
          setStakingRewards(stakes);
        }
      } catch (err) {
        setError('Failed to load rewards');
        console.error('Error fetching rewards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [session]);

  const formatAmount = (amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '0';
    return value.toLocaleString();
  };

  const claimRequestBounty = async (requestId: string, novelAddress: string) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    setClaimingBounty(requestId);
    try {
      const bountyId = keccak256(stringToBytes(requestId, { size: 32 }));
      const contract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novelAddress,
      });

      const transaction = prepareContractCall({
        contract,
        method: 'function claimRequestBounty(bytes32 _bountyId)',
        params: [bountyId],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      // Update the database to mark as claimed
      const updateResponse = await fetch('/api/rewards/claim-bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          transactionHash: result.transactionHash,
        }),
      });

      if (updateResponse.ok) {
        // Update local state
        setRequestBounties((prev) =>
          prev.map((bounty) => (bounty.id === requestId ? { ...bounty, claimed: true } : bounty))
        );
      } else {
        throw new Error('Failed to update claim status');
      }
    } catch (err) {
      console.error('Error claiming bounty:', err);
      alert('Failed to claim bounty');
    } finally {
      setClaimingBounty(null);
    }
  };

  const claimCommentBounty = async (commentId: string, novelAddress: string) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    setClaimingComment(commentId);
    try {
      const commentIdBytes32 = keccak256(stringToBytes(commentId, { size: 32 }));
      const contract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novelAddress,
      });

      const transaction = prepareContractCall({
        contract,
        method: 'function claimCommentBounty(bytes32 _commentId)',
        params: [commentIdBytes32],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      // Update the database to mark as claimed
      const updateResponse = await fetch('/api/rewards/claim-comment-bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          transactionHash: result.transactionHash,
        }),
      });

      if (updateResponse.ok) {
        // Update local state
        setCommentBounties((prev) =>
          prev.map((bounty) => (bounty.id === commentId ? { ...bounty, claimed: true } : bounty))
        );
      } else {
        throw new Error('Failed to update claim status');
      }
    } catch (err) {
      console.error('Error claiming comment bounty:', err);
      alert('Failed to claim comment bounty');
    } finally {
      setClaimingComment(null);
    }
  };

  const claimReplyBounty = async (replyId: string, novelAddress: string) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    setClaimingReply(replyId);
    try {
      const replyIdBytes32 = keccak256(stringToBytes(replyId, { size: 32 }));
      const contract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novelAddress,
      });

      const transaction = prepareContractCall({
        contract,
        method: 'function claimCommentBounty(bytes32 _commentId)',
        params: [replyIdBytes32],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      // Update the database to mark as claimed
      const updateResponse = await fetch('/api/rewards/claim-reply-bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyId,
          transactionHash: result.transactionHash,
        }),
      });

      if (updateResponse.ok) {
        // Update local state
        setReplyBounties((prev) =>
          prev.map((bounty) => (bounty.id === replyId ? { ...bounty, claimed: true } : bounty))
        );
      } else {
        throw new Error('Failed to update claim status');
      }
    } catch (err) {
      console.error('Error claiming reply bounty:', err);
      alert('Failed to claim reply bounty');
    } finally {
      setClaimingReply(null);
    }
  };

  const claimStakingReward = async (
    stakeId: string,
    requestId: string,
    replyId: string,
    novelAddress: string
  ) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    setClaimingStake(stakeId);
    try {
      const bountyId = keccak256(stringToBytes(requestId, { size: 32 }));
      const submissionId = keccak256(stringToBytes(replyId, { size: 32 }));

      const contract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novelAddress,
      });

      const transaction = prepareContractCall({
        contract,
        method: 'function claimStakeOnRequestBounty(bytes32 _bountyId, bytes32 _submissionId)',
        params: [bountyId, submissionId],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      // Update the database to mark stake as claimed
      const updateResponse = await fetch('/api/rewards/claim-stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stakeId,
          transactionHash: result.transactionHash,
        }),
      });

      if (updateResponse.ok) {
        // Update local state
        setStakingRewards((prev) =>
          prev.map((stake) => (stake.id === stakeId ? { ...stake, claimed: true } : stake))
        );
      } else {
        throw new Error('Failed to update claim status');
      }
    } catch (err) {
      console.error('Error claiming staking reward:', err);
      alert('Failed to claim staking reward');
    } finally {
      setClaimingStake(null);
    }
  };

  const ClaimButton = ({
    onClick,
    loading,
    disabled,
  }: {
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
  }) => (
    <div className="flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="group relative flex w-28 items-center justify-center space-x-1 overflow-hidden rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-3 py-1 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-500 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
      >
        {/* Shimmer effect */}
        <div className="group-hover:animate-shimmer absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Inner glow */}
        <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-purple-300/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Content */}
        <div className="relative z-10 flex items-center space-x-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin drop-shadow-sm" />
          ) : (
            <HandCoins className="h-4 w-4 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
          )}
          <span className="drop-shadow-sm">{loading ? 'Claiming...' : 'Claim'}</span>
        </div>

        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-150 group-active:opacity-100" />
      </button>
    </div>
  );

  const ClaimedLabel = () => (
    <div className="inline-flex w-28 items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">
      <CircleCheckBig className="mr-2 h-5 w-5 text-gray-500" />
      Claimed
    </div>
  );

  if (loading) {
    return (
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center space-x-2">
          <Gift className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">My Rewards</h2>
        </div>
        <div className="text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <p className="text-gray-500">Loading rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center space-x-2">
        <Gift className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">My Rewards</h2>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {/* Bounty Rewards Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-2">
          <Coins className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">Bounty Rewards</h3>
        </div>

        {/* Request Bounties Subsection */}
        <div className="mb-6">
          <h4 className="text-md mb-3 font-medium text-purple-600">1. Request Bounties</h4>

          {requestBounties.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">No request bounties available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white/50 shadow-sm">
                {/* Desktop Table for Request Bounties */}
                <div className="hidden md:block">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                          Story Title
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                          Bounty Amount
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestBounties.map((bounty, index) => (
                        <tr
                          key={bounty.id}
                          className={`border-b border-purple-50 ${index % 2 === 0 ? 'bg-white/30' : 'bg-purple-50/30'} transition-colors duration-200 hover:bg-purple-50/50`}
                        >
                          <td className="px-6 py-5 font-medium text-gray-800">
                            {bounty.chapter.novel.title}
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-semibold text-purple-600">
                              {formatAmount(bounty.bountyAmount)}
                            </span>
                            <span className="ml-2 text-purple-600">
                              {bounty.chapter.novel.coinSymbol}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              {bounty.claimed ? (
                                <ClaimedLabel />
                              ) : (
                                <ClaimButton
                                  onClick={() =>
                                    claimRequestBounty(
                                      bounty.id,
                                      bounty.chapter.novel.novelAddress!
                                    )
                                  }
                                  loading={claimingBounty === bounty.id}
                                  disabled={!bounty.isAwarded || !bounty.chapter.novel.novelAddress}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comment Bounties Subsection */}
        <div className="mb-6">
          <h4 className="text-md mb-3 font-medium text-purple-600">2. Comment Bounties</h4>

          {commentBounties.length === 0 && replyBounties.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">No comment bounties available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white/50 shadow-sm">
                {/* Desktop Table for Comment Bounties */}
                <div className="hidden md:block">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                          Story Title
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                          Bounty Amount
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {commentBounties.map((bounty, index) => (
                        <tr
                          key={`comment-${bounty.id}`}
                          className={`border-b border-purple-50 ${index % 2 === 0 ? 'bg-white/30' : 'bg-purple-50/30'} transition-colors duration-200 hover:bg-purple-50/50`}
                        >
                          <td className="px-6 py-5 font-medium text-gray-800">
                            {bounty.chapter.novel.title}
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-semibold text-purple-600">
                              {formatAmount(bounty.bountyAmount)}
                            </span>
                            <span className="ml-2 text-purple-600">
                              {bounty.chapter.novel.coinSymbol}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              {bounty.claimed ? (
                                <ClaimedLabel />
                              ) : (
                                <ClaimButton
                                  onClick={() =>
                                    claimCommentBounty(
                                      bounty.id,
                                      bounty.chapter.novel.novelAddress!
                                    )
                                  }
                                  loading={claimingComment === bounty.id}
                                  disabled={!bounty.chapter.novel.novelAddress}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {replyBounties.map((bounty, index) => (
                        <tr
                          key={`reply-${bounty.id}`}
                          className={`border-b border-purple-50 ${(commentBounties.length + index) % 2 === 0 ? 'bg-white/30' : 'bg-purple-50/30'} transition-colors duration-200 hover:bg-purple-50/50`}
                        >
                          <td className="px-6 py-5 font-medium text-gray-800">
                            {bounty.comment.chapter.novel.title}
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-semibold text-purple-600">
                              {formatAmount(bounty.bountyAmount)}
                            </span>
                            <span className="ml-2 text-purple-600">
                              {bounty.comment.chapter.novel.coinSymbol}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              {bounty.claimed ? (
                                <ClaimedLabel />
                              ) : (
                                <ClaimButton
                                  onClick={() =>
                                    claimReplyBounty(
                                      bounty.id,
                                      bounty.comment.chapter.novel.novelAddress!
                                    )
                                  }
                                  loading={claimingReply === bounty.id}
                                  disabled={!bounty.comment.chapter.novel.novelAddress}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staking Rewards Section */}
      <div>
        <div className="mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">Staking Rewards</h3>
        </div>

        {/* Request Bounty Staking Subsection */}
        <div className="mb-6">
          <h4 className="text-md mb-3 font-medium text-purple-600">1. Request Bounty Staking</h4>

          {stakingRewards.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">No staking rewards available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table for Staking Rewards */}
              <div className="hidden md:block">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                        Story Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">
                        Stake Amount
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingRewards.map((stake, index) => (
                      <tr
                        key={stake.id}
                        className={`border-b border-purple-50 ${index % 2 === 0 ? 'bg-white/30' : 'bg-purple-50/30'} transition-colors duration-200 hover:bg-purple-50/50`}
                      >
                        <td className="px-6 py-5 font-medium text-gray-800">
                          {stake.request.chapter.novel.title}
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-semibold text-purple-600">
                            {formatAmount(stake.stakeAmount)}
                          </span>
                          <span className="ml-2 text-purple-600">
                            {stake.request.chapter.novel.coinSymbol}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {stake.claimed ? (
                              <ClaimedLabel />
                            ) : (
                              <ClaimButton
                                onClick={() =>
                                  claimStakingReward(
                                    stake.id,
                                    stake.request.id,
                                    stake.replyId,
                                    stake.request.chapter.novel.novelAddress!
                                  )
                                }
                                loading={claimingStake === stake.id}
                                disabled={
                                  !stake.request.isAwarded ||
                                  stake.request.winningReplyId !== stake.replyId ||
                                  !stake.request.chapter.novel.novelAddress
                                }
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Placeholder sections for future implementation */}
        <div className="mb-4">
          <h4 className="text-md mb-3 font-medium text-purple-600">2. Comment Bounty Staking</h4>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>

        <div>
          <h4 className="text-md mb-3 font-medium text-purple-600">3. Novel Revenue Staking</h4>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRewards;
