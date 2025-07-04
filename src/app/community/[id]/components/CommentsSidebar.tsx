import { useEffect, useRef, useState } from 'react';

import {
  Check,
  CircleDollarSign,
  Loader2,
  MessageCircle,
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

interface Reply {
  id: string;
  content: string;
  user: User;
  createdAt: string;
  isOptimistic?: boolean;
}

interface Comment {
  id: string;
  content: string;
  highlightedText: string;
  user: User;
  createdAt: string;
  startOffset: number;
  endOffset: number;
  replies: Reply[];
  isAuthorComment?: boolean;
}

interface Novel {
  id: string;
  title: string;
  coinSymbol?: string;
  coinAddress?: string;
  novelAddress?: string;
  author: User;
}

interface CommentsSidebarProps {
  comments: Comment[];
  onReply: (commentId: string, content: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  isVisible: boolean;
  onClose: () => void;
  novel: Novel | null;
  scrollToCommentId?: string | null;
}

interface UpvoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemType: 'comment' | 'reply';
  novel: Novel | null;
  onSuccess: () => void;
}

interface ItemStats {
  upvotes: number;
  totalStaked: number;
}

function UpvoteDialog({ isOpen, onClose, itemId, itemType, novel, onSuccess }: UpvoteDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'upvote' | 'stake' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const account = useActiveAccount();

  // Get token balance
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

  const handleUpvoteOnly = async () => {
    if (!itemId) return;

    setIsProcessing(true);
    setCurrentStep('Initiating upvote');

    try {
      const endpoint =
        itemType === 'comment' ? `/api/comments/${itemId}/upvote` : `/api/replies/${itemId}/upvote`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'upvote' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
    if (!itemId || !novel?.novelAddress || !novel?.coinAddress || !account) return;

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

      // Convert itemId to bytes32 for _commentId
      const commentIdBytes32 = keccak256(stringToBytes(itemId, { size: 32 }));

      // Stake the tokens
      const transaction = prepareContractCall({
        contract: novelContract,
        method: 'function stakeOnComment(bytes32 _commentId, uint256 _commentStakedAmount)',
        params: [commentIdBytes32, stakeAmountWei],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      setCurrentStep('Step 3/3|Finalising upvote with staking');

      // Update database
      const endpoint =
        itemType === 'comment' ? `/api/comments/${itemId}/stake` : `/api/replies/${itemId}/stake`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stakeAmount,
          transactionHash: result.transactionHash,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-purple-800">
            Upvote {itemType === 'comment' ? 'Comment' : 'Reply'}
          </h3>
        </div>

        {isProcessing ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-600" />
            {currentStep && (
              <div className="space-y-2">
                {currentStep.includes('|') ? (
                  <>
                    <h4 className="text-lg font-semibold text-purple-800">
                      {currentStep.split('|')[0]}
                    </h4>
                    <p className="text-purple-700">{currentStep.split('|')[1]}</p>
                  </>
                ) : (
                  <p className="text-purple-700">{currentStep}</p>
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
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="font-medium text-purple-800">Upvote only</div>
                <div className="text-sm text-purple-600">Show support for this {itemType}</div>
              </button>

              <button
                onClick={() => setSelectedOption('stake')}
                className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedOption === 'stake'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="font-medium text-purple-800">Upvote with staking</div>
                <div className="text-sm text-purple-600">Stake tokens to show stronger support</div>
              </button>
            </div>

            {selectedOption === 'stake' && (
              <div className="space-y-3 rounded-lg bg-purple-50 p-3">
                <div className="flex items-center text-sm text-purple-700">
                  <Wallet className="mr-2 h-4 w-4" />
                  Balance: {balance} {novel?.coinSymbol || 'TOKEN'}
                </div>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  className="w-full rounded border border-purple-300 p-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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

// formatDateTime function
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  let dateDisplay: string;
  if (diffInHours < 24) {
    dateDisplay = 'Today';
  } else if (diffInHours < 48) {
    dateDisplay = 'Yesterday';
  } else {
    dateDisplay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  const timeDisplay = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    date: dateDisplay,
    time: timeDisplay,
  };
};

export default function CommentsSidebar({
  comments,
  onReply,
  replyingTo,
  setReplyingTo,
  isVisible,
  onClose,
  novel,
  scrollToCommentId,
}: CommentsSidebarProps) {
  const { data: session } = useSession();
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [upvoteDialogOpen, setUpvoteDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'comment' | 'reply'>('comment');
  const [itemStats, setItemStats] = useState<Record<string, ItemStats>>({});
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load stats for all comments and replies
  useEffect(() => {
    const loadStats = async () => {
      const allItems: Array<{ id: string; type: 'comment' | 'reply' }> = [];

      // Add all comments
      comments.forEach((comment) => {
        allItems.push({ id: comment.id, type: 'comment' });
        // Add all replies
        comment.replies.forEach((reply) => {
          allItems.push({ id: reply.id, type: 'reply' });
        });
      });

      // Fetch stats for all items
      const statsPromises = allItems.map(async (item) => {
        try {
          const endpoint =
            item.type === 'comment'
              ? `/api/comments/${item.id}/stats`
              : `/api/replies/${item.id}/stats`;
          const response = await fetch(endpoint);
          if (response.ok) {
            const stats = await response.json();
            return { id: item.id, stats };
          }
        } catch (error) {
          console.error(`Failed to fetch stats for ${item.type} ${item.id}:`, error);
        }
        return { id: item.id, stats: { upvotes: 0, totalStaked: 0 } };
      });

      const results = await Promise.all(statsPromises);
      const newStats: Record<string, ItemStats> = {};
      results.forEach((result) => {
        newStats[result.id] = result.stats;
      });
      setItemStats(newStats);
    };

    if (comments.length > 0) {
      loadStats();
    }
  }, [comments]);

  // Load user's existing upvotes
  useEffect(() => {
    const loadUserUpvotes = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch user's comment upvotes
        const commentUpvotesResponse = await fetch('/api/user/comment-upvotes');
        const commentUpvotes = commentUpvotesResponse.ok ? await commentUpvotesResponse.json() : [];

        // Fetch user's reply upvotes  
        const replyUpvotesResponse = await fetch('/api/user/reply-upvotes');
        const replyUpvotes = replyUpvotesResponse.ok ? await replyUpvotesResponse.json() : [];

        console.log('Comment upvotes from API:', commentUpvotes);
        console.log('Reply upvotes from API:', replyUpvotes);

        // Combine all upvoted item IDs
        const allUpvotedIds = new Set([
          ...commentUpvotes,
          ...replyUpvotes
        ]);

        console.log('All upvoted IDs:', Array.from(allUpvotedIds));
        setUserUpvotes(allUpvotedIds);
      } catch (error) {
        console.error('Failed to load user upvotes:', error);
      }
    };

    loadUserUpvotes();
  }, [session?.user?.id]);

  const handleUpvoteClick = (itemId: string, itemType: 'comment' | 'reply') => {
    if (userUpvotes.has(itemId)) {
      return;
    }

    setSelectedItemId(itemId);
    setSelectedItemType(itemType);
    setUpvoteDialogOpen(true);
  };

  const handleUpvoteSuccess = () => {
    if (selectedItemId) {
      // Refresh stats for the item
      const endpoint =
        selectedItemType === 'comment'
          ? `/api/comments/${selectedItemId}/stats`
          : `/api/replies/${selectedItemId}/stats`;
      fetch(endpoint)
        .then((response) => response.json())
        .then((stats) => {
          setItemStats((prev) => ({ ...prev, [selectedItemId]: stats }));
          setUserUpvotes((prev) => new Set([...prev, selectedItemId]));
        })
        .catch((error) => console.error('Failed to refresh stats:', error));
    }
  };

  // Auto-scroll to reply form when it opens
  useEffect(() => {
    if (replyingTo && replyFormRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        replyFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    }
  }, [replyingTo]);

  // Auto-scroll to specific comment when scrollToCommentId changes
  useEffect(() => {
    if (scrollToCommentId && commentRefs.current[scrollToCommentId] && scrollContainerRef.current) {
      setTimeout(() => {
        commentRefs.current[scrollToCommentId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }, 100);
    }
  }, [scrollToCommentId]);

  const handleReplySubmit = async (commentId: string) => {
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    const tempReply = {
      id: `temp-${Date.now()}`,
      content: replyContent.trim(),
      user: { name: 'You', email: '' },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic update
    const originalContent = replyContent;
    setReplyContent('');
    setReplyingTo(null);

    try {
      await onReply(commentId, originalContent);
    } catch (error) {
      // Revert on error
      setReplyContent(originalContent);
      setReplyingTo(commentId);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!isVisible) return null;

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
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Comments</h3>
              <span className="rounded-full bg-white/20 px-2 py-1 text-xs">{comments.length}</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 transition-colors duration-200 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Comments content - Scrollable area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-6 pb-20">
            {comments.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">No comments yet.</p>
                <p className="mt-1 text-xs text-gray-400">Select text to add the first comment!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment, index) => {
                  const commentDateTime = formatDateTime(comment.createdAt);
                  const commentStats = itemStats[comment.id] || { upvotes: 0, totalStaked: 0 };
                  const hasUserUpvoted = userUpvotes.has(comment.id);

                  return (
                    <div
                      key={comment.id}
                      className="group"
                      ref={(el) => {
                        commentRefs.current[comment.id] = el;
                      }}
                    >
                      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                        {/* Highlighted text reference */}
                        <div className="border-b border-purple-100 bg-white px-4 py-3">
                          <p className="mb-1 text-xs font-medium text-purple-700">
                            Referenced text:
                          </p>
                          <div className="text-sm leading-relaxed italic">
                            <span
                              className="highlighted-comment-text"
                              style={{
                                backgroundColor: 'rgb(237 233 254)',
                                color: 'rgb(168 85 247)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                              }}
                            >
                              "{comment.highlightedText}"
                            </span>
                          </div>
                        </div>

                        {/* Comment content */}
                        <div className="p-4">
                          <p className="mb-3 leading-relaxed text-gray-800">{comment.content}</p>

                          {/* Comment metadata */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-semibold text-white">
                                {(comment.user.name || comment.user.email || 'A')[0].toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-600">
                                {comment.user.name || comment.user.email}
                                {comment.isAuthorComment && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                    Author
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">{commentDateTime.date}</div>
                              <div className="text-xs text-gray-400">{commentDateTime.time}</div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex flex-col items-start space-y-1">
                              <button
                                onClick={() => handleUpvoteClick(comment.id, 'comment')}
                                disabled={hasUserUpvoted}
                                className={`flex items-center space-x-1 rounded-lg px-2 py-1 text-sm transition-all duration-200 ${
                                  hasUserUpvoted
                                    ? 'cursor-not-allowed text-purple-400'
                                    : 'text-purple-600 hover:bg-purple-50 hover:text-purple-800'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{commentStats.upvotes}</span>
                                {hasUserUpvoted && (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span className="text-xs">Voted</span>
                                  </>
                                )}
                              </button>
                              {commentStats.totalStaked > 0 && (
                                <div className="flex items-center space-x-1 px-2 text-xs text-purple-600">
                                  <CircleDollarSign className="h-3 w-3" />
                                  <span>{commentStats.totalStaked}</span>
                                  <span>{novel?.coinSymbol || 'tokens'}</span>
                                  <span>staked</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setReplyingTo(comment.id);
                                setReplyContent('');
                              }}
                              className="flex items-center space-x-1 rounded-lg px-2 py-1 text-sm text-purple-600 transition-all duration-200 hover:bg-purple-50 hover:text-purple-800"
                              disabled={submittingReply}
                            >
                              <Reply className="h-4 w-4" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 ml-6 space-y-3">
                          {comment.replies.map((reply) => {
                            const replyDateTime = formatDateTime(reply.createdAt);
                            const replyStats = itemStats[reply.id] || {
                              upvotes: 0,
                              totalStaked: 0,
                            };
                            const hasUserUpvotedReply = userUpvotes.has(reply.id);
                            console.log(`Reply ${reply.id} - hasUserUpvotedReply:`, hasUserUpvotedReply, 'userUpvotes:', Array.from(userUpvotes));

                            return (
                              <div
                                key={reply.id}
                                className={`rounded-lg border-l-4 border-purple-200 bg-gray-50 p-3 ${
                                  reply.isOptimistic ? 'animate-pulse opacity-70' : ''
                                }`}
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
                                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                          Author
                                        </span>
                                      )}
                                      {reply.isOptimistic && (
                                        <span className="ml-1 text-purple-500 italic">
                                          Sending...
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

                                {/* Reply upvote button */}
                                {!reply.isOptimistic && (
                                  <div className="mt-2 flex flex-col items-start space-y-1">
                                    <button
                                      onClick={() => handleUpvoteClick(reply.id, 'reply')}
                                      disabled={hasUserUpvotedReply}
                                      className={`flex items-center space-x-1 rounded-lg px-2 py-1 text-xs transition-all duration-200 ${
                                        hasUserUpvotedReply
                                          ? 'cursor-not-allowed text-purple-400'
                                          : 'text-purple-600 hover:bg-purple-100 hover:text-purple-800'
                                      }`}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                      <span>{replyStats.upvotes}</span>
                                      {hasUserUpvotedReply && (
                                        <>
                                          <Check className="h-2 w-2" />
                                          <span className="text-xs">Voted</span>
                                        </>
                                      )}
                                    </button>
                                    {replyStats.totalStaked > 0 && (
                                      <div className="flex items-center space-x-1 px-2 text-xs text-purple-600">
                                        <CircleDollarSign className="h-3 w-3" />
                                        <span>{replyStats.totalStaked}</span>
                                        <span>{novel?.coinSymbol || 'tokens'}</span>
                                        <span>staked</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply form */}
                      {replyingTo === comment.id && (
                        <div
                          ref={replyFormRef}
                          className="mt-4 ml-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="space-y-3">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a thoughtful reply..."
                              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                              rows={3}
                              style={{ color: '#111827' }}
                              autoFocus
                              disabled={submittingReply}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  handleReplySubmit(comment.id);
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
                                onClick={() => handleReplySubmit(comment.id)}
                                className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                      {/* Divider between comments */}
                      {index < comments.length - 1 && (
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
        itemId={selectedItemId}
        itemType={selectedItemType}
        novel={novel}
        onSuccess={handleUpvoteSuccess}
      />
    </>
  );
}
