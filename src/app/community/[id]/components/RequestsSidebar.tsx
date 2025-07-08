'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Check,
  CircleCheckBig,
  CircleDollarSign,
  Crown,
  Loader2,
  MessageCircleQuestion,
  Reply,
  Send,
  ThumbsUp,
  Wallet,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { keccak256, stringToBytes } from 'viem';

import { client } from '@/lib/thirdweb';

interface User {
  id: string;
  name?: string;
  email?: string;
  walletAddress?: string;
}

interface RequestReply {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  isOptimistic?: boolean;
}

interface Request {
  id: string;
  content: string;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  bountyAmount: string;
  stakersReward: string;
  contractBountyId?: string;
  transactionHash?: string;
  contractConfirmed: boolean;
  isAwarded: boolean;
  winnerId?: string;
  winningReplyId?: string;
  awardTransactionHash?: string;
  awardedAt?: string;
  user: User;
  createdAt: string;
  replies: RequestReply[];
}

interface Novel {
  id: string;
  title: string;
  coinSymbol?: string;
  coinAddress?: string;
  novelAddress?: string;
  author: User;
}

interface RequestsSidebarProps {
  requests: Request[];
  novel?: Novel;
  onRequestsUpdate: (requests: Request[]) => void;
  onReply?: (requestId: string, content: string) => void;
  replyingTo?: string | null;
  setReplyingTo?: (id: string | null) => void;
  isVisible?: boolean;
  onClose?: () => void;
  scrollToRequestId?: string | null;
}

interface UpvoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  replyId: string | null;
  requestId: string | null;
  novel?: Novel;
  onSuccess: () => void;
  // Add these new props for optimistic updates
  replyStats: Record<string, ReplyStats>;
  setReplyStats: React.Dispatch<React.SetStateAction<Record<string, ReplyStats>>>;
  userUpvotes: Set<string>;
  setUserUpvotes: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface AwardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  replyId: string | null;
  requestId: string | null;
  novel?: Novel;
  winnerWalletAddress?: string;
  winnerId?: string;
  onSuccess: () => void;
}

interface ReplyStats {
  upvotes: number;
  totalStaked: number;
}

function AwardDialog({
  isOpen,
  onClose,
  replyId,
  requestId,
  novel,
  winnerWalletAddress,
  winnerId,
  onSuccess,
}: AwardDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const account = useActiveAccount();

  const handleAward = async () => {
    if (
      !replyId ||
      !requestId ||
      !novel?.novelAddress ||
      !account ||
      !winnerWalletAddress ||
      !winnerId
    )
      return;

    setIsProcessing(true);

    try {
      setCurrentStep('Preparing|...');

      // Get the novel contract
      const novelContract = getContract({
        client,
        chain: baseSepolia,
        address: novel.novelAddress as `0x${string}`,
      });

      // Convert requestId to bytes32 for bountyId
      const bountyIdBytes32 = keccak256(stringToBytes(requestId, { size: 32 }));
      console.log('bountyIdBytes32', bountyIdBytes32);

      // Convert replyId to bytes32 for winningSubmission
      const winningSubmissionBytes32 = keccak256(stringToBytes(replyId, { size: 32 }));
      console.log('winningSubmissionBytes32', winningSubmissionBytes32);

      setCurrentStep('Step 1/2|Releasing Bounty');

      // Call setRequestBountyWinner function
      const transaction = prepareContractCall({
        contract: novelContract,
        method:
          'function setRequestBountyWinner(bytes32 _bountyId, address _winner, bytes32 _winningSubmission)',
        params: [bountyIdBytes32, winnerWalletAddress as `0x${string}`, winningSubmissionBytes32],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      setCurrentStep('Step 2/2|Releasing Staking Rewards');

      // Update database
      const response = await fetch(`/api/requests/${requestId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winningReplyId: replyId,
          winnerId: winnerId,
          awardTransactionHash: result.transactionHash,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update database');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setIsProcessing(false);
        setCurrentStep('');
      }, 1000);
    } catch (error) {
      console.error('Award failed:', error);
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-900/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-yellow-800">Award Reply</h3>
          <p className="mt-2 text-sm text-gray-600">
            This will award the bounty to the reply author and staking rewards to all who have
            staked on it
          </p>
        </div>

        {isProcessing ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-yellow-600" />
            {currentStep && (
              <div className="space-y-2">
                {currentStep.includes('|') ? (
                  <>
                    <h4 className="text-lg font-semibold text-yellow-800">
                      {currentStep.split('|')[0]}
                    </h4>
                    <p className="text-yellow-700">{currentStep.split('|')[1]}</p>
                  </>
                ) : (
                  <p className="text-yellow-700">{currentStep}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAward}
              className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
            >
              Award
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UpvoteDialog({
  isOpen,
  onClose,
  replyId,
  requestId,
  novel,
  onSuccess,
  replyStats,
  setReplyStats,
  setUserUpvotes,
}: UpvoteDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'upvote' | 'stake' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progressStep, setProgressStep] = useState<number | undefined>(undefined);
  const [balance, setBalance] = useState<string>('0');
  const account = useActiveAccount();

  // Store original stats for potential reversion
  const [originalStats, setOriginalStats] = useState<ReplyStats | null>(null);

  // Progress steps for staking (3 steps)
  const progressSteps = ['Transferring token', 'Staking token', 'Finalising upvote'];

  // Helper function to update stats optimistically
  const updateReplyStatsOptimistically = (replyId: string, updates: Partial<ReplyStats>) => {
    setReplyStats((prev) => ({
      ...prev,
      [replyId]: {
        ...prev[replyId],
        ...updates,
      },
    }));
  };

  // Error handler for reverting optimistic updates
  const handleUpvoteError = (replyId: string, originalStats: ReplyStats) => {
    // Revert optimistic updates if server call fails
    setReplyStats((prev) => ({
      ...prev,
      [replyId]: originalStats,
    }));
    setUserUpvotes((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.delete(replyId);
      return newSet;
    });
  };

  // Get token balance - only if we have both coinAddress and account
  const tokenContract =
    novel?.coinAddress && account?.address
      ? getContract({
          client,
          chain: baseSepolia,
          address: novel.coinAddress as `0x${string}`,
        })
      : undefined;

  const { data: tokenBalance } = useReadContract(
    tokenContract && account?.address
      ? {
          contract: tokenContract,
          method: 'function balanceOf(address) view returns (uint256)',
          params: [account.address],
        }
      : {
          contract: getContract({
            client,
            chain: baseSepolia,
            address: '0x0000000000000000000000000000000000000000',
          }),
          method: 'function balanceOf(address) view returns (uint256)',
          params: ['0x0000000000000000000000000000000000000000'],
          queryOptions: { enabled: false },
        }
  );

  useEffect(() => {
    if (tokenBalance) {
      const balanceInTokens = Number(tokenBalance) / Math.pow(10, 18);
      setBalance(balanceInTokens.toFixed(2));
    }
  }, [tokenBalance]);

  // Store original stats when dialog opens
  useEffect(() => {
    if (isOpen && replyId) {
      const currentStats = replyStats[replyId] || { upvotes: 0, totalStaked: 0 };
      setOriginalStats(currentStats);
    }
  }, [isOpen, replyId, replyStats]);

  const handleUpvoteOnly = async () => {
    if (!replyId || !originalStats) return;

    setIsProcessing(true);
    setCurrentStep('Initiating upvote');
    console.log(currentStep);

    // Optimistically update upvote count
    updateReplyStatsOptimistically(replyId, {
      upvotes: originalStats.upvotes + 1,
    });

    // Mark as upvoted by user optimistically
    setUserUpvotes((prev: Set<string>) => new Set([...prev, replyId]));

    try {
      const response = await fetch(`/api/request-replies/${replyId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'upvote' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upvote error:', errorData);
        throw new Error(`Failed to upvote: ${errorData.error || 'Unknown error'}`);
      }

      setCurrentStep('Completing upvote');
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsProcessing(false);
        setCurrentStep('');
      }, 1000);
    } catch (error) {
      console.error('Upvote failed:', error);

      // Revert optimistic updates on any error
      handleUpvoteError(replyId, originalStats);

      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleStakeUpvote = async () => {
    if (
      !replyId ||
      !requestId ||
      !novel?.novelAddress ||
      !novel?.coinAddress ||
      !account ||
      !originalStats
    )
      return;

    const stakeAmountWei = BigInt(Math.floor(parseFloat(stakeAmount) * Math.pow(10, 18)));
    const stakeAmountFloat = parseFloat(stakeAmount);

    setIsProcessing(true);
    setProgressStep(0); // Start progress bar

    // Optimistically update both upvote count and staked amount
    updateReplyStatsOptimistically(replyId, {
      upvotes: originalStats.upvotes + 1,
      totalStaked: originalStats.totalStaked + stakeAmountFloat,
    });

    // Mark as upvoted by user optimistically
    setUserUpvotes((prev: Set<string>) => new Set([...prev, replyId]));

    try {
      setCurrentStep('Initiating');

      // Get the token contract for approval
      const tokenContract = getContract({
        client,
        chain: baseSepolia,
        address: novel.coinAddress as `0x${string}`,
      });

      // Get the novel contract
      const novelContract = getContract({
        client,
        chain: baseSepolia,
        address: novel.novelAddress as `0x${string}`,
      });

      setProgressStep(0); // Step 1: Transferring token
      setCurrentStep('Step 1/3|Transferring token');

      // First approve the novel contract to spend tokens
      const approveTransaction = prepareContractCall({
        contract: tokenContract,
        method: 'function approve(address spender, uint256 amount)',
        params: [novel.novelAddress as `0x${string}`, stakeAmountWei],
      });

      await sendTransaction({
        transaction: approveTransaction,
        account,
      });

      setProgressStep(1); // Step 2: Staking token
      setCurrentStep('Step 2/3|Staking token');

      // Convert requestId to bytes32 for bountyId
      const bountyIdBytes32 = keccak256(stringToBytes(requestId, { size: 32 }));

      // Convert replyId to bytes32 for submissionId
      const submissionIdBytes32 = keccak256(stringToBytes(replyId, { size: 32 }));

      // Stake the tokens with correct parameter types
      const transaction = prepareContractCall({
        contract: novelContract,
        method:
          'function stakeOnRequestBounty(bytes32 _bountyId, bytes32 _submissionId, uint256 _bountyStakedAmount)',
        params: [bountyIdBytes32, submissionIdBytes32, stakeAmountWei],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      setProgressStep(2); // Step 3: Finalising upvote with staking
      setCurrentStep('Step 3/3|Finalising upvote with staking');

      // Update database - this can fail even if blockchain transaction succeeds
      const dbResponse = await fetch(`/api/request-replies/${replyId}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stakeAmount,
          transactionHash: result.transactionHash,
          submissionId: submissionIdBytes32,
        }),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        console.error('Database update failed:', errorData);
        throw new Error(`Failed to update database: ${errorData.error || 'Unknown error'}`);
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setIsProcessing(false);
        setCurrentStep('');
        setProgressStep(undefined);
        setStakeAmount('');
      }, 1000);
    } catch (error) {
      console.error('Stake failed:', error);

      // Revert optimistic updates on any error (blockchain or database)
      handleUpvoteError(replyId, originalStats);

      setIsProcessing(false);
      setCurrentStep('');
      setProgressStep(undefined);
    }
  };

  const isValidStakeAmount = () => {
    const amount = parseFloat(stakeAmount);
    return amount > 0 && amount <= parseFloat(balance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-900/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-green-500">Upvote Reply</h3>
        </div>

        {isProcessing ? (
          <div className="text-center">
            {selectedOption === 'stake' && progressStep !== undefined ? (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {progressSteps.map((stepTitle, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            index < progressStep
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                              : index === progressStep
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                          }`}
                        >
                          {index < progressStep ? (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : index === progressStep ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-xs font-medium text-white">{index + 1}</span>
                          )}
                        </div>
                        <span
                          className={`mt-1 max-w-[60px] text-center text-xs font-medium ${
                            index < progressStep
                              ? 'text-green-600'
                              : index === progressStep
                                ? 'text-green-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {stepTitle}
                        </span>
                      </div>
                      {index < progressSteps.length - 1 && (
                        <div
                          className={`ml-4 h-0.5 w-16 ${
                            index < progressStep ? 'bg-green-300' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Simple spinner for upvote-only */
              <div className="py-2">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
                <p className="mt-3 text-sm text-green-700">Processing upvote...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => setSelectedOption('upvote')}
                className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedOption === 'upvote'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-medium text-green-800">Upvote only</div>
                <div className="text-sm text-green-600">Show support for this reply</div>
              </button>

              <button
                onClick={() => setSelectedOption('stake')}
                className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedOption === 'stake'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-medium text-green-800">Upvote with staking</div>
                <div className="text-sm text-green-600">Stake tokens to show stronger support</div>
              </button>
            </div>

            {selectedOption === 'stake' && (
              <div className="space-y-3">
                {/* Token Balance Display - Updated to match RequestDialog style */}
                <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
                  <Wallet className="h-5 w-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Wallet Balance:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {balance} {novel?.coinSymbol || 'TOKEN'} tokens
                  </span>
                </div>

                {/* Stake Amount Input - Updated styling */}
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Number of ${novel?.coinSymbol || 'TOKEN'} tokens`}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
                  step="0.01"
                  min="0"
                  max={balance}
                />

                {stakeAmount && !isValidStakeAmount() && (
                  <p className="text-sm text-red-600">
                    {parseFloat(stakeAmount) > parseFloat(balance)
                      ? 'Insufficient balance'
                      : 'Please enter a valid amount'}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={selectedOption === 'upvote' ? handleUpvoteOnly : handleStakeUpvote}
                disabled={!selectedOption || (selectedOption === 'stake' && !isValidStakeAmount())}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedOption === 'upvote' ? 'Upvote' : 'Stake & Upvote'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestsSidebar({
  requests,
  novel,
  onRequestsUpdate,
  onReply,
  replyingTo: externalReplyingTo,
  setReplyingTo: externalSetReplyingTo,
  isVisible = true,
  onClose,
  scrollToRequestId,
}: RequestsSidebarProps) {
  const { data: session } = useSession();
  const [internalReplyingTo, setInternalReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submittingReply, setSubmittingReply] = useState(false);
  const [upvoteDialogOpen, setUpvoteDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedWinnerWalletAddress, setSelectedWinnerWalletAddress] = useState<
    string | undefined
  >(undefined);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | undefined>(undefined);

  // Add missing state variables
  const [replyStats, setReplyStats] = useState<Record<string, ReplyStats>>({});
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [isLoadingUpvotes, setIsLoadingUpvotes] = useState(false);

  // Add missing refs
  const replyFormRef = useRef<HTMLDivElement>(null);
  const requestRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use external replyingTo if provided, otherwise use internal
  const replyingTo = externalReplyingTo !== undefined ? externalReplyingTo : internalReplyingTo;
  const setReplyingTo = externalSetReplyingTo || setInternalReplyingTo;

  // Check if current user is the author
  const isAuthor = session?.user?.id === novel?.author?.id;

  const handleUpvoteClick = (replyId: string, requestId: string) => {
    // Don't open dialog if user already upvoted
    if (userUpvotes.has(replyId)) {
      return;
    }

    setSelectedReplyId(replyId);
    setSelectedRequestId(requestId);
    setUpvoteDialogOpen(true);
  };

  const handleAwardClick = (
    replyId: string,
    requestId: string,
    winnerWalletAddress: string,
    winnerId: string
  ) => {
    setSelectedReplyId(replyId);
    setSelectedRequestId(requestId);
    setSelectedWinnerWalletAddress(winnerWalletAddress);
    setSelectedWinnerId(winnerId);
    setAwardDialogOpen(true);
  };

  const handleUpvoteSuccess = () => {
    // The optimistic updates are already done in the dialog
    // This function is called when everything succeeds
    if (selectedReplyId) {
      setUserUpvotes((prev) => new Set([...prev, selectedReplyId]));
    }
  };

  // Add a new error handler for reverting optimistic updates
  // const handleUpvoteError = (replyId: string, originalStats: ReplyStats) => {
  //   // Revert optimistic updates if server call fails
  //   setReplyStats((prev) => ({
  //     ...prev,
  //     [replyId]: originalStats,
  //   }));
  //   setUserUpvotes((prev) => {
  //     const newSet = new Set(prev);
  //     newSet.delete(replyId);
  //     return newSet;
  //   });
  // };

  const handleAwardSuccess = () => {
    // Update the specific request to show it's been awarded
    if (selectedRequestId && selectedReplyId) {
      const updatedRequests = requests.map((request) => {
        if (request.id === selectedRequestId) {
          return {
            ...request,
            isAwarded: true,
            winningReplyId: selectedReplyId,
            awardedAt: new Date().toISOString(),
          };
        }
        return request;
      });
      onRequestsUpdate(updatedRequests);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return {
        date: 'Today',
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };
    } else if (diffInHours < 48) {
      return {
        date: 'Yesterday',
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };
    } else {
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };
    }
  };

  const handleReplySubmit = async (requestId: string) => {
    if (!replyContent.trim() || !session?.user?.id) return;

    // Store the content and immediately clear UI
    const originalContent = replyContent;
    setReplyContent(''); // Clear input immediately
    setReplyingTo(null); // Hide reply form immediately

    // If external onReply is provided, use it
    if (onReply) {
      try {
        await onReply(requestId, originalContent);
      } catch (error) {
        console.error('Error submitting reply:', error);
        // Show error message and revert on error
        alert('Failed to send reply. Please try again.');
        setReplyContent(originalContent);
        setReplyingTo(requestId);
      }
      return;
    }

    // Otherwise, use internal logic
    // Create optimistic reply that looks like a real reply (no isOptimistic flag)
    const optimisticReply: RequestReply = {
      id: `temp-${Date.now()}`,
      content: originalContent,
      createdAt: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
      },
      // No isOptimistic flag - reply appears normal immediately
    };

    // Update UI optimistically - reply appears instantly as if it succeeded
    const updatedRequests = requests.map((request) =>
      request.id === requestId
        ? { ...request, replies: [...(request.replies || []), optimisticReply] }
        : request
    );
    onRequestsUpdate(updatedRequests);

    try {
      const response = await fetch('/api/request-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          content: originalContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const newReply = await response.json();

      // Replace optimistic reply with real reply (same content, but real ID)
      const finalRequests = requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              replies: (request.replies || [])
                .filter((reply) => reply.id !== optimisticReply.id)
                .concat(newReply),
            }
          : request
      );
      onRequestsUpdate(finalRequests);
    } catch (error) {
      console.error('Error submitting reply:', error);

      // Remove optimistic reply on error
      const revertedRequests = requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              replies: (request.replies || []).filter((reply) => reply.id !== optimisticReply.id),
            }
          : request
      );
      onRequestsUpdate(revertedRequests);

      // Show error message and restore the reply form
      alert('Failed to send reply. Please try again.');
      setReplyContent(originalContent);
      setReplyingTo(requestId);
    }
  };

  useEffect(() => {
    if (replyingTo && replyFormRef.current) {
      replyFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [replyingTo]);

  // Add this missing useEffect for auto-scroll to specific request
  useEffect(() => {
    if (scrollToRequestId && requestRefs.current[scrollToRequestId] && scrollContainerRef.current) {
      setTimeout(() => {
        requestRefs.current[scrollToRequestId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }, 100);
    }
  }, [scrollToRequestId]);

  // FIXED: Enhanced fetch reply data with better error handling and loading states
  useEffect(() => {
    const fetchReplyData = async () => {
      if (!session?.user?.id || requests.length === 0) return;

      const allReplyIds = requests.flatMap((request) =>
        (request.replies || []).map((reply) => reply.id)
      );

      // Filter out temporary IDs before making API calls
      const validReplyIds = allReplyIds.filter((id) => !id.startsWith('temp-'));

      if (validReplyIds.length === 0) return;

      setIsLoadingUpvotes(true);

      try {
        // Fetch stats for all valid replies
        const statsPromises = validReplyIds.map(async (replyId) => {
          try {
            const response = await fetch(`/api/request-replies/${replyId}/stats`);
            if (response.ok) {
              const stats = await response.json();
              return { replyId, stats };
            }
          } catch (error) {
            console.error(`Failed to fetch stats for reply ${replyId}:`, error);
          }
          return null;
        });

        const statsResults = await Promise.all(statsPromises);
        const newStats: Record<string, ReplyStats> = {};
        statsResults.forEach((result) => {
          if (result) {
            newStats[result.replyId] = result.stats;
          }
        });
        setReplyStats(newStats);

        // FIXED: Enhanced upvote fetching with better error handling
        try {
          const upvoteResponse = await fetch(
            `/api/user/upvotes?replyIds=${validReplyIds.join(',')}`
          );
          if (upvoteResponse.ok) {
            const upvotedReplyIds = await upvoteResponse.json();
            console.log('Fetched upvoted reply IDs:', upvotedReplyIds); // Debug log
            setUserUpvotes(new Set(upvotedReplyIds));
          } else {
            console.error('Failed to fetch upvotes, status:', upvoteResponse.status);
            const errorText = await upvoteResponse.text();
            console.error('Upvote fetch error:', errorText);
          }
        } catch (error) {
          console.error('Failed to fetch user upvotes:', error);
        }
      } catch (error) {
        console.error('Failed to fetch reply data:', error);
      } finally {
        setIsLoadingUpvotes(false);
      }
    };

    fetchReplyData();
  }, [requests, session?.user?.id]);

  // FIXED: Add a separate effect to persist upvotes in localStorage as backup
  useEffect(() => {
    if (session?.user?.id && userUpvotes.size > 0) {
      const upvotesArray = Array.from(userUpvotes);
      localStorage.setItem(`userUpvotes_${session.user.id}`, JSON.stringify(upvotesArray));
    }
  }, [userUpvotes, session?.user?.id]);

  // FIXED: Load upvotes from localStorage on mount as fallback
  useEffect(() => {
    if (session?.user?.id) {
      try {
        const savedUpvotes = localStorage.getItem(`userUpvotes_${session.user.id}`);
        if (savedUpvotes) {
          const upvotesArray = JSON.parse(savedUpvotes);
          setUserUpvotes(new Set(upvotesArray));
        }
      } catch (error) {
        console.error('Failed to load upvotes from localStorage:', error);
      }
    }
  }, [session?.user?.id]);

  // Handle visibility
  if (!isVisible) {
    return null;
  }

  if (requests.length === 0) {
    return (
      <div
        className="fixed right-0 z-30 flex w-96 flex-col border-l border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-2xl"
        style={{
          top: '152px',
          height: 'calc(100vh - 152px)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header with close button - Fixed at top */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircleQuestion className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Requests</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 transition-colors duration-200 hover:bg-green-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <MessageCircleQuestion className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No requests yet</h3>
            <p className="text-gray-500">
              Highlight text in the chapter to create your first request for feedback.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed right-0 z-30 flex w-96 flex-col border-l border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-2xl"
        style={{
          top: '152px',
          height: 'calc(100vh - 152px)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header with close button - Fixed at top */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircleQuestion className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Requests</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 transition-colors duration-200 hover:bg-green-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollContainerRef} className="h-full overflow-y-auto">
            {requests.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <MessageCircleQuestion className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">No requests yet</p>
                  <p className="text-sm text-gray-500">
                    Be the first to create a request for feedback!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {requests.map((request, index) => {
                  const requestDateTime = formatDateTime(request.createdAt);

                  return (
                    <div
                      key={request.id}
                      ref={(el) => {
                        if (el) {
                          requestRefs.current[request.id] = el;
                        }
                      }}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                    >
                      {/* Highlighted text */}
                      <div className="mb-3 rounded-lg bg-green-50 p-3">
                        <p className="text-sm font-medium text-green-800">
                          &ldquo;{request.highlightedText}&rdquo;
                        </p>
                      </div>

                      {/* Request content */}
                      <p className="mb-3 text-gray-800">{request.content}</p>

                      {/* Bounty information */}
                      <div className="mb-3 rounded-lg bg-green-50 p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center space-x-1">
                              <CircleDollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Bounty</span>
                            </div>
                            <div className="text-sm text-green-700">
                              {request.bountyAmount} {novel?.coinSymbol || 'tokens'}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-1">
                              <CircleDollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Staking Reward
                              </span>
                            </div>
                            <div className="text-sm text-green-700">
                              {request.stakersReward} {novel?.coinSymbol || 'tokens'}
                            </div>
                          </div>
                        </div>

                        {/* Awarded label with darker green background - only shown when request is awarded */}
                        {request.isAwarded && (
                          <div className="mt-3">
                            <div className="inline-flex items-center space-x-1 rounded-lg bg-green-200 px-2 py-1">
                              <CircleCheckBig className="h-4 w-4 text-green-700" />
                              <span className="text-sm font-medium text-green-700">Awarded</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Request metadata and actions */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-sm text-white">
                              {(request.user.name || request.user.email || 'A')[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-600">
                              {request.user.name || request.user.email}
                              {novel && request.user.id === novel.author.id && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                  Author
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{requestDateTime.date}</div>
                            <div className="text-xs text-gray-400">{requestDateTime.time}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {/* REMOVED: The yellow awarded label that was here */}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setReplyingTo(request.id);
                                setReplyContent('');
                              }}
                              className="flex items-center space-x-1 rounded-lg px-2 py-1 text-sm text-green-600 transition-all duration-200 hover:bg-green-50 hover:text-green-800"
                              disabled={submittingReply}
                            >
                              <Reply className="h-4 w-4" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {(request.replies || []).length > 0 && (
                        <div className="mt-3 ml-6 space-y-3">
                          {(request.replies || []).map((reply) => {
                            const replyDateTime = formatDateTime(reply.createdAt);
                            const stats = replyStats[reply.id] || { upvotes: 0, totalStaked: 0 };
                            const hasUserUpvoted = userUpvotes.has(reply.id);
                            const isWinningReply = request.winningReplyId === reply.id;

                            return (
                              <div
                                key={reply.id}
                                className="rounded-lg border-l-4 border-green-200 bg-gray-50 p-3"
                              >
                                <p className="mb-2 text-sm text-gray-800">{reply.content}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-xs text-white">
                                      {(reply.user.name ||
                                        reply.user.email ||
                                        'A')[0].toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {reply.user.name || reply.user.email}
                                      {novel && reply.user.id === novel.author.id && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                          Author
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                      {replyDateTime.date}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {replyDateTime.time}
                                    </div>
                                  </div>
                                </div>

                                {/* Reply actions */}
                                {!reply.isOptimistic && (
                                  <div className="mt-2">
                                    <div className="flex flex-col items-start space-y-1">
                                      {isWinningReply ? (
                                        <div className="rounded-lg bg-yellow-50 px-2 py-1">
                                          <div className="flex items-center space-x-1">
                                            <Crown className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm text-yellow-700">Awarded</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {/* FIXED: Show loading state while fetching upvotes */}
                                          <button
                                            onClick={() => handleUpvoteClick(reply.id, request.id)}
                                            disabled={
                                              hasUserUpvoted ||
                                              request.isAwarded ||
                                              isLoadingUpvotes
                                            }
                                            className={`flex items-center space-x-1 rounded-lg px-2 py-1 text-sm transition-all duration-200 ${
                                              hasUserUpvoted
                                                ? 'cursor-not-allowed text-green-400'
                                                : request.isAwarded
                                                  ? 'cursor-not-allowed text-gray-400'
                                                  : isLoadingUpvotes
                                                    ? 'cursor-wait text-gray-400'
                                                    : 'text-green-600 hover:bg-green-50 hover:text-green-800'
                                            }`}
                                          >
                                            <ThumbsUp className="h-4 w-4" />
                                            <span>{stats.upvotes}</span>
                                            {hasUserUpvoted && (
                                              <>
                                                <Check className="h-3 w-3" />
                                                <span className="text-xs">Voted</span>
                                              </>
                                            )}
                                            {/* REMOVED: The "Awarded" text that was showing on all replies */}
                                            {isLoadingUpvotes && (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            )}
                                          </button>
                                          {stats.totalStaked > 0 && (
                                            <div className="flex items-center space-x-1 px-2 text-xs text-green-600">
                                              <CircleDollarSign className="h-3 w-3" />
                                              <span>{stats.totalStaked}</span>
                                              <span>{novel?.coinSymbol || 'tokens'}</span>
                                              <span>staked</span>
                                            </div>
                                          )}
                                          {isAuthor &&
                                            reply.user.walletAddress &&
                                            !request.isAwarded && (
                                              <button
                                                onClick={() =>
                                                  handleAwardClick(
                                                    reply.id,
                                                    request.id,
                                                    reply.user.walletAddress!,
                                                    reply.user.id
                                                  )
                                                }
                                                className="flex items-center space-x-1 rounded-lg px-2 py-1 text-sm text-yellow-600 transition-all duration-200 hover:bg-yellow-50 hover:text-yellow-800"
                                              >
                                                <Crown className="h-4 w-4" />
                                                <span>Award</span>
                                              </button>
                                            )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply form */}
                      {replyingTo === request.id && (
                        <div
                          ref={replyFormRef}
                          className="mt-4 ml-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="space-y-3">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a thoughtful reply..."
                              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                              rows={3}
                              style={{ color: '#111827' }}
                              autoFocus
                              disabled={submittingReply}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  handleReplySubmit(request.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                  }}
                                  className="text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700"
                                  disabled={submittingReply}
                                >
                                  Cancel
                                </button>
                              </div>
                              <button
                                onClick={() => handleReplySubmit(request.id)}
                                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!replyContent.trim() || submittingReply}
                              >
                                {submittingReply ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                <span>{submittingReply ? 'Sending...' : 'Reply'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Divider between requests */}
                      {index < requests.length - 1 && (
                        <div className="my-6 border-t border-gray-200"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upvote Dialog */}
      <UpvoteDialog
        isOpen={upvoteDialogOpen}
        onClose={() => setUpvoteDialogOpen(false)}
        replyId={selectedReplyId}
        requestId={selectedRequestId}
        novel={novel}
        onSuccess={handleUpvoteSuccess}
        replyStats={replyStats}
        setReplyStats={setReplyStats}
        userUpvotes={userUpvotes}
        setUserUpvotes={setUserUpvotes}
      />

      {/* Award Dialog */}
      <AwardDialog
        isOpen={awardDialogOpen}
        onClose={() => setAwardDialogOpen(false)}
        replyId={selectedReplyId}
        requestId={selectedRequestId}
        novel={novel}
        winnerWalletAddress={selectedWinnerWalletAddress}
        winnerId={selectedWinnerId}
        onSuccess={handleAwardSuccess}
      />
    </>
  );
}
