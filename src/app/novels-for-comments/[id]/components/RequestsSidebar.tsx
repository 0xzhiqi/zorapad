'use client';

import { useEffect, useRef, useState } from 'react';

import {
  CircleDollarSign,
  Crown,
  HandCoins,
  Loader2,
  MessageCircleQuestion,
  Reply,
  Send,
  ThumbsUp,
  TimerOff,
  Wallet,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { bytesToHex, keccak256, stringToBytes } from 'viem';

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

      setCurrentStep('Step 1/2|Awarding');

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

      setCurrentStep('Step 2/2|Finalising');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-900/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-green-800">Award Request</h3>
          <p className="mt-2 text-sm text-gray-600">
            This will award the bounty to the selected reply and mark the request as completed.
          </p>
        </div>

        {isProcessing ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-green-600" />
            {currentStep && (
              <div className="space-y-2">
                {currentStep.includes('|') ? (
                  <>
                    <h4 className="text-lg font-semibold text-green-800">
                      {currentStep.split('|')[0]}
                    </h4>
                    <p className="text-green-700">{currentStep.split('|')[1]}</p>
                  </>
                ) : (
                  <p className="text-green-700">{currentStep}</p>
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
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
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
}: UpvoteDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'upvote' | 'stake' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const account = useActiveAccount();

  // Get token balance - only if we have both coinAddress and account
  const tokenContract =
    novel?.coinAddress && account?.address
      ? getContract({
          client,
          chain: baseSepolia,
          address: novel.coinAddress as `0x${string}`,
        })
      : undefined;

  // Fix the useReadContract call - use conditional execution instead of undefined
  const shouldFetchBalance = !!(tokenContract && account?.address);

  const { data: tokenBalance } = useReadContract(
    tokenContract && account?.address
      ? {
          contract: tokenContract,
          method: 'function balanceOf(address) view returns (uint256)',
          params: [account.address],
        }
      : {
          // Provide a dummy contract and params when disabled
          contract: getContract({
            client,
            chain: baseSepolia,
            address: '0x0000000000000000000000000000000000000000',
          }),
          method: 'function balanceOf(address) view returns (uint256)',
          params: ['0x0000000000000000000000000000000000000000'],
          // Correctly disable the query
          queryOptions: { enabled: false },
        }
  );

  useEffect(() => {
    if (tokenBalance) {
      // Convert from wei to token units (assuming 18 decimals) and format to 2 decimal places
      const balanceInTokens = Number(tokenBalance) / Math.pow(10, 18);
      setBalance(balanceInTokens.toFixed(2));
    }
  }, [tokenBalance]);

  const handleUpvoteOnly = async () => {
    if (!replyId) return;

    setIsProcessing(true);
    setCurrentStep('Initiating upvote');

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
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleStakeUpvote = async () => {
    if (!replyId || !requestId || !novel?.novelAddress || !novel?.coinAddress || !account) return;

    const stakeAmountWei = BigInt(Math.floor(parseFloat(stakeAmount) * Math.pow(10, 18)));

    setIsProcessing(true);

    try {
      setCurrentStep('Initiating|...');

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

      setCurrentStep('Step 2/3|Staking token');

      // Convert requestId to bytes32 for bountyId (this must match how bounty was created)
      const bountyIdBytes32 = keccak256(stringToBytes(requestId, { size: 32 }));
      //   const bountyIdHex = bytesToHex(bountyIdBytes);

      // Convert replyId to bytes32 for submissionId
      const submissionIdBytes32 = keccak256(stringToBytes(replyId, { size: 32 }));
      //   const submissionIdHex = bytesToHex(submissionIdBytes);

      // Stake the tokens with correct parameter types
      const transaction = prepareContractCall({
        contract: novelContract,
        method:
          'function stakeOnRequestBounty(bytes32 _bountyId, bytes32 _submissionId, uint256 _bountyStakedAmount)',
        // params: [bountyIdBytes32 as `0x${string}`, submissionIdHex as `0x${string}`, stakeAmountWei],
        params: [bountyIdBytes32, submissionIdBytes32, stakeAmountWei],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      setCurrentStep('Step 3/3|Finalising upvote with staking');

      // Update database
      await fetch(`/api/request-replies/${replyId}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stakeAmount,
          transactionHash: result.transactionHash,
          submissionId: submissionIdBytes32,
        }),
      });

      setTimeout(() => {
        onSuccess();
        onClose();
        setIsProcessing(false);
        setCurrentStep('');
        setStakeAmount('');
      }, 1000);
    } catch (error) {
      console.error('Stake failed:', error);
      setIsProcessing(false);
      setCurrentStep('');
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
          <h3 className="text-lg font-semibold text-green-800">Upvote Reply</h3>
        </div>

        {isProcessing ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-green-600" />
            {currentStep && (
              <div className="space-y-2">
                {currentStep.includes('|') ? (
                  <>
                    <h4 className="text-lg font-semibold text-green-800">
                      {currentStep.split('|')[0]}
                    </h4>
                    <p className="text-green-700">{currentStep.split('|')[1]}</p>
                  </>
                ) : (
                  <p className="text-green-700">{currentStep}</p>
                )}
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
              <div className="space-y-3 rounded-lg bg-green-50 p-3">
                <div className="flex items-center text-sm text-green-700">
                  <Wallet className="mr-2 h-4 w-4" />
                  Balance: {balance} {novel?.coinSymbol || 'TOKEN'}
                </div>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  className="w-full rounded border border-green-300 p-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
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

  // Add missing refs
  const replyFormRef = useRef<HTMLDivElement>(null);
  const requestRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use external replyingTo if provided, otherwise use internal
  const replyingTo = externalReplyingTo !== undefined ? externalReplyingTo : internalReplyingTo;
  const setReplyingTo = externalSetReplyingTo || setInternalReplyingTo;

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
    // Refresh reply stats
    if (selectedReplyId) {
      fetch(`/api/request-replies/${selectedReplyId}/stats`)
        .then((response) => response.json())
        .then((stats) => {
          setReplyStats((prev) => ({ ...prev, [selectedReplyId]: stats }));
          // Add the reply to user upvotes
          setUserUpvotes((prev) => new Set([...prev, selectedReplyId]));
        })
        .catch((error) => console.error('Failed to refresh stats:', error));
    }
  };

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

    setSubmittingReply(true);

    // If external onReply is provided, use it
    if (onReply) {
      try {
        await onReply(requestId, replyContent);
        setReplyContent('');
        setReplyingTo(null);
      } catch (error) {
        console.error('Error submitting reply:', error);
      } finally {
        setSubmittingReply(false);
      }
      return;
    }

    // Otherwise, use internal logic
    // Create optimistic reply
    const optimisticReply: RequestReply = {
      id: `temp-${Date.now()}`,
      content: replyContent,
      createdAt: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
      },
      isOptimistic: true,
    };

    // Update UI optimistically
    const updatedRequests = requests.map((request) =>
      request.id === requestId
        ? { ...request, replies: [...request.replies, optimisticReply] }
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
          content: replyContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const newReply = await response.json();

      // Replace optimistic reply with real reply
      const finalRequests = requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              replies: request.replies
                .filter((reply) => reply.id !== optimisticReply.id)
                .concat(newReply),
            }
          : request
      );
      onRequestsUpdate(finalRequests);

      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      // Remove optimistic reply on error
      const revertedRequests = requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              replies: request.replies.filter((reply) => reply.id !== optimisticReply.id),
            }
          : request
      );
      onRequestsUpdate(revertedRequests);
    } finally {
      setSubmittingReply(false);
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

  // Fetch reply stats and user upvotes when requests change
  useEffect(() => {
    const fetchReplyData = async () => {
      if (!session?.user?.id || requests.length === 0) return;

      const allReplyIds = requests.flatMap((request) =>
        (request.replies || []).map((reply) => reply.id)
      );

      // Filter out temporary IDs before making API calls
      const validReplyIds = allReplyIds.filter((id) => !id.startsWith('temp-'));

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

      // Fetch user upvotes only for valid IDs
      if (validReplyIds.length > 0) {
        try {
          const upvoteResponse = await fetch(
            `/api/user/upvotes?replyIds=${validReplyIds.join(',')}`
          );
          if (upvoteResponse.ok) {
            const upvotedReplyIds = await upvoteResponse.json();
            setUserUpvotes(new Set(upvotedReplyIds));
          }
        } catch (error) {
          console.error('Failed to fetch user upvotes:', error);
        }
      }
    };

    fetchReplyData();
  }, [requests, session?.user?.id]);

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
                className="rounded-full p-1 transition-colors duration-200 hover:bg-white/20"
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
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm font-medium">
              {requests.length}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 transition-colors duration-200 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Requests content - Scrollable area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-6 pb-20">
          <div className="space-y-6">
            {requests.map((request) => {
              const requestDateTime = formatDateTime(request.createdAt);
              return (
                <div
                  key={request.id}
                  className="group"
                  ref={(el) => {
                    requestRefs.current[request.id] = el;
                  }}
                >
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                    {/* Highlighted text reference */}
                    <div className="border-b border-green-100 bg-white px-4 py-3">
                      <p className="mb-1 text-xs font-medium text-green-700">Referenced text:</p>
                      <div className="text-sm leading-relaxed italic">
                        <span
                          className="highlighted-request-text"
                          style={{
                            backgroundColor: 'rgb(220 252 231)',
                            color: 'rgb(22 101 52)',
                            padding: '2px 4px',
                            borderRadius: '4px',
                          }}
                        >
                          "{request.highlightedText}"
                        </span>
                      </div>
                    </div>

                    {/* Request content */}
                    <div className="p-4">
                      <p className="mb-3 leading-relaxed text-gray-800">{request.content}</p>

                      {/* Bounty and Stakers Reward */}
                      <div className="mb-4 flex items-center space-x-4 rounded-lg bg-green-50 p-3">
                        <div className="flex-1 flex-col space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <CircleDollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800"> Bounty</span>
                          </div>
                          <div className="text-sm font-semibold text-green-800">
                            {request.bountyAmount} {novel?.coinSymbol || 'TOKEN'}
                          </div>
                        </div>
                        <div className="flex-1 flex-col space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <CircleDollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Staking Reward
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-green-800">
                            {request.stakersReward} {novel?.coinSymbol || 'TOKEN'}
                          </div>
                        </div>
                      </div>

                      {/* Request metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-xs font-semibold text-white">
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
                          <div className="text-xs text-gray-500">{requestDateTime.date}</div>
                          <div className="text-xs text-gray-400">{requestDateTime.time}</div>
                        </div>
                      </div>

                      {/* Reply button */}
                      <div className="mt-3 flex justify-end">
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

                  {/* Replies Section */}
                  <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                    {(request.replies || []).map((reply) => {
                      const replyDateTime = formatDateTime(reply.createdAt);
                      const stats = replyStats[reply.id] || { upvotes: 0, totalStaked: 0 };
                      const isWinningReply = request.winningReplyId === reply.id;
                      const isAuthor = novel && session?.user?.id === novel.author.id;
                      const canAward = isAuthor && !request.isAwarded && reply.user.walletAddress;

                      return (
                        <div
                          key={reply.id}
                          className={`rounded-lg border-l-4 ${isWinningReply ? 'border-yellow-400 bg-yellow-50' : 'border-green-200 bg-gray-50'} p-3 ${reply.isOptimistic ? 'animate-pulse opacity-70' : ''}`}
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <p className="flex-1 text-sm text-gray-800">{reply.content}</p>
                            {isWinningReply && (
                              <div className="ml-2 flex flex-shrink-0 items-center space-x-1">
                                <div className="flex items-center space-x-1 rounded-full bg-yellow-100 px-2 py-1">
                                  <Crown className="h-3 w-3 text-yellow-600" />
                                  <span className="text-xs font-medium text-yellow-800">
                                    Awarded
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Reply actions */}
                            <div className="mt-3 flex flex-col space-y-2">
                              {/* Upvotes and Vote button */}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>
                                    {reply.id.startsWith('temp-')
                                      ? 0
                                      : replyStats[reply.id]?.upvotes || 0}{' '}
                                  </span>
                                </div>

                                {request.isAwarded ? (
                                  <div className="flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <TimerOff className="h-3 w-3 text-slate-500" strokeWidth={4} />
                                    <span>Voting Closed</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleUpvoteClick(reply.id, request.id)}
                                    disabled={
                                      userUpvotes.has(reply.id) || reply.id.startsWith('temp-')
                                    }
                                    className={`flex items-center space-x-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                                      userUpvotes.has(reply.id) || reply.id.startsWith('temp-')
                                        ? 'cursor-not-allowed border-green-200 bg-green-100 text-green-700'
                                        : 'border-gray-300 bg-white text-gray-700 shadow-sm hover:border-green-400 hover:bg-green-50 hover:text-green-700 hover:shadow-md active:scale-95'
                                    }`}
                                  >
                                    <ThumbsUp
                                      className={`h-3 w-3 ${
                                        userUpvotes.has(reply.id) ? 'fill-current' : ''
                                      }`}
                                    />
                                    <span>
                                      {reply.id.startsWith('temp-')
                                        ? 'Sending...'
                                        : userUpvotes.has(reply.id)
                                          ? 'Voted'
                                          : 'Upvote'}
                                    </span>
                                  </button>
                                )}
                              </div>

                              {/* Display staked tokens below */}
                              {!reply.id.startsWith('temp-') &&
                                replyStats[reply.id]?.totalStaked > 0 && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <CircleDollarSign className="h-3 w-3" />
                                    <span>
                                      {Number(replyStats[reply.id]?.totalStaked || 0).toFixed(2)}{' '}
                                      {novel?.coinSymbol || 'tokens'} staked
                                    </span>
                                  </div>
                                )}

                              {/* Award button for novel author */}
                              {canAward && !reply.id.startsWith('temp-') && (
                                <button
                                  onClick={() =>
                                    handleAwardClick(
                                      reply.id,
                                      request.id,
                                      reply.user.walletAddress!,
                                      reply.user.id
                                    )
                                  }
                                  className="flex items-center space-x-1 rounded bg-green-600 px-2 py-1 text-xs text-white transition-colors hover:bg-green-700"
                                >
                                  <HandCoins className="h-3 w-3" />
                                  <span>Award</span>
                                </button>
                              )}
                            </div>

                            {/* Reply author and timestamp */}
                            <div className="flex items-center space-x-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-xs text-white">
                                {(reply.user.name || reply.user.email || 'A')[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600">
                                  {reply.user.name || reply.user.email}
                                  {novel && reply.user.id === novel.author.id && (
                                    <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                                      Author
                                    </span>
                                  )}
                                </span>
                                <div className="text-xs text-gray-400">
                                  {replyDateTime.date}, {replyDateTime.time}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply form */}
                  {replyingTo === request.id && (
                    <div
                      ref={replyFormRef}
                      className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <UpvoteDialog
        isOpen={upvoteDialogOpen}
        onClose={() => setUpvoteDialogOpen(false)}
        replyId={selectedReplyId}
        requestId={selectedRequestId}
        novel={novel}
        onSuccess={handleUpvoteSuccess}
      />

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
    </div>
  );
}
