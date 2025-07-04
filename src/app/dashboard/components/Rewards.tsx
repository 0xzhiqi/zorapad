'use client';

import { useEffect, useState } from 'react';

import { Check, CircleCheckBig, Coins, Gift, HandCoins, Loader2, TrendingUp } from 'lucide-react';
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
      coinAddress?: string;
      novelAddress?: string; // Add this line
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
        coinAddress?: string;
        novelAddress?: string; // Add this line
      };
    };
  };
}

const Rewards = () => {
  const { data: session } = useSession();
  const account = useActiveAccount();
  const [requestBounties, setRequestBounties] = useState<RequestBounty[]>([]);
  const [stakingRewards, setStakingRewards] = useState<StakingReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingBounty, setClaimingBounty] = useState<string | null>(null);
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
        address: novelAddress, // Use novelAddress instead of coinAddress
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

  const claimStakingReward = async (
    stakeId: string,
    requestId: string,
    replyId: string,
    novelAddress: string // Change parameter name from coinAddress to novelAddress
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
        address: novelAddress, // Use novelAddress instead of coinAddress
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
        className="group relative flex w-20 items-center justify-center space-x-1 overflow-hidden rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-3 py-1 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-500 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
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
          <h2 className="text-xl font-semibold text-gray-900">Rewards</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Rewards</h2>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {/* Request Bounties Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-2">
          <Coins className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">Request Bounties</h3>
        </div>

        {requestBounties.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-500">No request bounties available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Bounty Amount
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requestBounties.map((bounty) => (
                    <tr key={bounty.id} className="border-b border-gray-100">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {formatAmount(bounty.bountyAmount)} tokens
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            bounty.isAwarded
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {bounty.isAwarded ? 'Awarded' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {bounty.claimed ? (
                            <ClaimedLabel />
                          ) : (
                            <ClaimButton
                              onClick={() =>
                                claimRequestBounty(bounty.id, bounty.chapter.novel.novelAddress!)
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

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
              {requestBounties.map((bounty) => (
                <div key={bounty.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {formatAmount(bounty.bountyAmount)} tokens
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        bounty.isAwarded
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {bounty.isAwarded ? 'Awarded' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    {bounty.claimed ? (
                      <ClaimedLabel />
                    ) : (
                      <ClaimButton
                        onClick={() =>
                          claimRequestBounty(bounty.id, bounty.chapter.novel.novelAddress!)
                        }
                        loading={claimingBounty === bounty.id}
                        disabled={!bounty.isAwarded || !bounty.chapter.novel.novelAddress}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staking Rewards Section */}
      <div>
        <div className="mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">Staking Rewards</h3>
        </div>

        {/* Request Bounty Staking Subsection */}
        <div className="mb-6">
          <h4 className="text-md mb-3 font-medium text-gray-800">Request Bounty Staking</h4>

          {stakingRewards.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">No staking rewards available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Stake Amount
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingRewards.map((stake) => (
                      <tr key={stake.id} className="border-b border-gray-100">
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {formatAmount(stake.stakeAmount)} tokens
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              stake.request.isAwarded
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {stake.request.isAwarded ? 'Awarded' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
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

              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {stakingRewards.map((stake) => (
                  <div key={stake.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {formatAmount(stake.stakeAmount)} tokens
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          stake.request.isAwarded
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {stake.request.isAwarded ? 'Awarded' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {stake.claimed ? (
                        <ClaimedLabel />
                      ) : (
                        <ClaimButton
                          onClick={() =>
                            claimStakingReward(
                              stake.id,
                              stake.request.id,
                              stake.replyId,
                              stake.request.chapter.novel.novelAddress! // Change from coinAddress to novelAddress
                            )
                          }
                          loading={claimingStake === stake.id}
                          disabled={
                            !stake.request.isAwarded ||
                            stake.request.winningReplyId !== stake.replyId ||
                            !stake.request.chapter.novel.novelAddress // Change from coinAddress to novelAddress
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Placeholder sections for future implementation */}
        <div className="mb-4">
          <h4 className="text-md mb-3 font-medium text-gray-800">Comment Bounty Staking</h4>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>

        <div>
          <h4 className="text-md mb-3 font-medium text-gray-800">Novel Revenue Staking</h4>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
