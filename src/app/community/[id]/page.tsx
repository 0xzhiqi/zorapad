'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import Highlight from '@tiptap/extension-highlight';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChevronDown, ChevronLeft, Loader2, Plus, Reply, Wallet, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { baseSepolia as thirdwebBaseSepolia } from 'thirdweb/chains';
import { approve } from 'thirdweb/extensions/erc20';
import { useActiveAccount } from 'thirdweb/react';
import { createPublicClient, formatEther, http, keccak256, parseEther, stringToBytes } from 'viem';
import { baseSepolia } from 'viem/chains';

import CommentsButton from './components/CommentsButton';
import CommentsSidebar from './components/CommentsSidebar';
import RequestsButton from './components/RequestsButton';
import RequestsSidebar from './components/RequestsSidebar';

interface Author {
  id: string;
  name?: string;
  email?: string;
}

interface Chapter {
  id: string;
  title: string;
  order?: number;
  wordCount?: number;
  contentUrl?: string;
}

interface Novel {
  id: string;
  title: string;
  author: Author;
  chapters: Chapter[];
  novelAddress?: string; // Address of the deployed novel contract
  coinTransactionHash?: string; // Transaction hash of coin creation
  coinAddress?: string; // Address of the coin contract
  coinSymbol?: string; // Symbol of the coin
}

interface User {
  id: string;
  name?: string;
  email?: string;
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
  startOffset: number;
  endOffset: number;
  isAuthorComment: boolean;
  user: User;
  replies: Reply[];
  createdAt: string;
}

interface RequestReply {
  id: string;
  content: string;
  user: User;
  createdAt: string;
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

interface Selection {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

const ChapterDropdown = ({
  chapters,
  selectedChapter,
  onSelect,
  disabled = false,
}: {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelect: (chapter: Chapter) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (chapters.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className="flex min-w-[200px] items-center justify-between space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate px-1 text-gray-700">
          {selectedChapter
            ? // ? `${selectedChapter.title}${selectedChapter.order ? ` (Chapter ${selectedChapter.order})` : ''}`
              `${selectedChapter.title}`
            : 'Select a chapter to read'}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 z-50 mt-1 min-w-[300px] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto bg-white py-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(chapter);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  selectedChapter?.id === chapter.id
                    ? 'border-l-4 border-purple-500 bg-purple-50'
                    : ''
                }`}
              >
                <div className="font-medium text-gray-900">{chapter.title}</div>
                <div className="text-xs text-gray-500 italic">
                  {chapter.order ? `Chapter ${chapter.order} • ` : ''}
                  {chapter.wordCount || 0} words
                  {/* {chapter.contentUrl ? ' • Has content' : ' • Empty'} */}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RequestDialog = ({
  isOpen,
  onClose,
  selection,
  onSubmit,
  loading,
  tokenBalance,
  coinSymbol,
  progressStep,
  showSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  selection: Selection | null;
  onSubmit: (content: string, bountyAmount: number, stakersReward: number) => void;
  loading: boolean;
  tokenBalance: number;
  coinSymbol: string;
  progressStep?: number;
  showSuccess?: boolean;
}) => {
  const [content, setContent] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [stakersReward, setStakersReward] = useState('');

  const progressSteps = [
    'Initiating request',
    'Transferring token',
    'Creating bounty',
    'Confirming Bounty',
  ];

  // Don't clear form or re-enable fields until dialog is fully closed
  const isProcessing = loading || showSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bounty = parseFloat(bountyAmount) || 0;
    const stakers = parseFloat(stakersReward) || 0;

    if (content.trim() && (bounty > 0 || stakers > 0)) {
      if (bounty + stakers <= tokenBalance) {
        onSubmit(content.trim(), bounty, stakers);
        // Don't clear form fields during loading or success state
      } else {
        alert(
          `Total amount (${bounty + stakers}) exceeds your token balance (${tokenBalance.toFixed(2)})`
        );
      }
    }
  };

  // Clear form when dialog closes completely
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setBountyAmount('');
      setStakersReward('');
    }
  }, [isOpen]);

  if (!isOpen || !selection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-700">Create Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Request Bounty created successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {loading && progressStep !== undefined && (
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
                      className={`mx-2 h-0.5 w-8 ${
                        index < progressStep ? 'bg-green-300' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-green-200 bg-green-100 p-3">
          <p className="mb-1 text-sm font-medium text-gray-700">Selected text:</p>
          <p className="text-sm font-medium text-green-800">&quot;{selection.text}&quot;</p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your request..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
            rows={4}
            disabled={isProcessing}
            required
            autoFocus={!isProcessing}
          />

          {/* Token Balance Display */}
          <div className="mt-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
            <Wallet className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Wallet Balance:</span>{' '}
            <span className="text-sm font-medium text-gray-700">
              {tokenBalance.toFixed(2)} {coinSymbol} tokens
            </span>
          </div>

          {/* Bounty Amount */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Bounty</label>
            <input
              type="number"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
              placeholder={`Number of ${coinSymbol} tokens`}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
              min="0"
              step="0.01"
              disabled={isProcessing}
            />
          </div>

          {/* Stakers Reward */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Stakers Rewards</label>
            <input
              type="number"
              value={stakersReward}
              onChange={(e) => setStakersReward(e.target.value)}
              placeholder={`Number of ${coinSymbol} tokens`}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
              min="0"
              step="0.01"
              disabled={isProcessing}
            />
          </div>

          {/* Total validation */}
          {(parseFloat(bountyAmount) || 0) + (parseFloat(stakersReward) || 0) > tokenBalance && (
            <div className="mt-2 text-sm text-red-600">Total amount exceeds your token balance</div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                isProcessing ||
                !content.trim() ||
                (parseFloat(bountyAmount) || 0) + (parseFloat(stakersReward) || 0) > tokenBalance
              }
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CommentDialog = ({
  isOpen,
  onClose,
  selection,
  onSubmit,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  selection: Selection | null;
  onSubmit: (content: string) => void;
  loading: boolean;
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  if (!isOpen || !selection) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Comment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-purple-100 p-3">
          <p className="mb-1 text-sm font-medium text-gray-700">Selected text:</p>
          <p className="text-sm font-medium text-purple-800">&quot;{selection.text}&quot;</p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            rows={4}
            disabled={loading}
            required
            autoFocus
          />

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 focus:outline-none"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || !content.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Add Comment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// const formatDateTime = (dateString: string) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

//   if (diffInHours < 24) {
//     return {
//       date: 'Today',
//       time: date.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true,
//       }),
//     };
//   } else {
//     return {
//       date: date.toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
//       }),
//       time: date.toLocaleTimeString('en-US', {
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true,
//       }),
//     };
//   }
// };

export default function NovelForComments() {
  const params = useParams();
  const novelId = params?.id as string;
  const { data: session } = useSession();
  const account = useActiveAccount();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment-related state
  const [comments, setComments] = useState<Comment[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 });
  const [commentLoading, setCommentLoading] = useState(false);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [scrollToCommentId, setScrollToCommentId] = useState<string | null>(null);

  // Request-related state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestProgressStep, setRequestProgressStep] = useState<number | undefined>(undefined);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [scrollToRequestId, setScrollToRequestId] = useState<string | null>(null);
  const [replyingToRequest, setReplyingToRequest] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Function to find comment by text position
  const findCommentByPosition = (clickPosition: number): Comment | null => {
    return (
      comments.find(
        (comment) => clickPosition >= comment.startOffset && clickPosition <= comment.endOffset
      ) || null
    );
  };

  // Function to find request by text position
  const findRequestByPosition = (clickPosition: number): Request | null => {
    return (
      requests.find(
        (request) => clickPosition >= request.startOffset && clickPosition <= request.endOffset
      ) || null
    );
  };

  // Function to handle highlighted text clicks
  const handleHighlightedTextClick = (event: MouseEvent, editor: Editor) => {
    const target = event.target as HTMLElement;

    // Check if clicked element is highlighted text
    if (target.tagName === 'MARK' || target.closest('mark')) {
      event.preventDefault();
      event.stopPropagation();

      // Get the actual mark element
      const markElement = target.tagName === 'MARK' ? target : target.closest('mark');
      if (!markElement || !editor) return;

      // Try to get the position using Tiptap's posAtDOM
      try {
        const clickPosition = editor.view.posAtDOM(markElement, 0);

        // Check if it's a request first (green highlighting)
        const matchingRequest = findRequestByPosition(clickPosition);
        if (matchingRequest) {
          // Open requests sidebar if closed
          if (!showRequestSidebar) {
            setShowRequestSidebar(true);
          }

          // Set the request to scroll to
          setScrollToRequestId(matchingRequest.id);

          // Clear the scroll target after a delay
          setTimeout(() => {
            setScrollToRequestId(null);
          }, 1000);
          return;
        }

        // Find the comment that corresponds to this position
        const matchingComment = findCommentByPosition(clickPosition);
        if (matchingComment) {
          // Open sidebar if closed
          if (!showCommentSidebar) {
            setShowCommentSidebar(true);
          }

          // Set the comment to scroll to
          setScrollToCommentId(matchingComment.id);

          // Clear the scroll target after a delay
          setTimeout(() => {
            setScrollToCommentId(null);
          }, 1000);
        }
      } catch (error) {
        console.error('Error getting click position:', error);

        // Fallback: find by matching the highlighted text
        const highlightedText = markElement.textContent;
        if (highlightedText) {
          const matchingRequest = requests.find(
            (request) => request.highlightedText === highlightedText
          );
          if (matchingRequest) {
            if (!showRequestSidebar) {
              setShowRequestSidebar(true);
            }
            setScrollToRequestId(matchingRequest.id);
            setTimeout(() => {
              setScrollToRequestId(null);
            }, 1000);
            return;
          }

          const matchingComment = comments.find(
            (comment) => comment.highlightedText === highlightedText
          );
          if (matchingComment) {
            if (!showCommentSidebar) {
              setShowCommentSidebar(true);
            }
            setScrollToCommentId(matchingComment.id);
            setTimeout(() => {
              setScrollToCommentId(null);
            }, 1000);
          }
        }
      }
    }
  };

  // Initialize Tiptap editor for read-only display
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlighted-comment-text',
          style: 'background-color: #f3e8ff; color: #a855f7;', // purple-100 bg, purple-500 text
        },
      }),
    ],
    content: '',
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleClick: (view, pos, event) => {
        handleHighlightedTextClick(event as MouseEvent, editor!);
        return false; // Allow default behavior
      },
    },
  });

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowCommentButton(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText.length === 0) {
        setShowCommentButton(false);
        return;
      }

      // Check if selection is within the content area
      const contentElement = contentRef.current;
      if (!contentElement || !contentElement.contains(range.commonAncestorContainer)) {
        setShowCommentButton(false);
        return;
      }

      if (!editor) {
        setShowCommentButton(false);
        return;
      }

      // Use Tiptap's built-in position calculation with fallback
      try {
        // Get the DOM position and convert to Tiptap position
        const proseMirrorElement = contentElement.querySelector('.ProseMirror');
        if (!proseMirrorElement) {
          setShowCommentButton(false);
          return;
        }

        // Try to get positions using posAtDOM
        let startPos = -1;
        let endPos = -1;

        try {
          startPos = editor.view.posAtDOM(range.startContainer, range.startOffset);
          endPos = editor.view.posAtDOM(range.endContainer, range.endOffset);
        } catch (domError) {
          console.warn('posAtDOM failed, using fallback method:', domError);
        }

        // Fallback method if posAtDOM fails
        if (startPos === -1 || endPos === -1) {
          // Use editor state selection if available
          if (editor.state.selection.from !== editor.state.selection.to) {
            startPos = editor.state.selection.from;
            endPos = editor.state.selection.to;
          } else {
            // Manual calculation as last resort
            // const editorText = editor.getText();
            const beforeText =
              range.startContainer.textContent?.substring(0, range.startOffset) || '';

            // Find the text position by walking through the document
            let textPos = 0;
            let found = false;

            editor.state.doc.descendants((node, pos) => {
              if (found) return false;

              if (node.isText && node.text) {
                if (textPos + node.text.length >= beforeText.length) {
                  const offsetInNode = beforeText.length - textPos;
                  startPos = pos + offsetInNode;
                  endPos = startPos + selectedText.length;
                  found = true;
                  return false;
                }
                textPos += node.text.length;
              }
            });

            if (!found) {
              // If still not found, use a simple text-based approach
              const fullText = editor.getText();
              const selectedIndex = fullText.indexOf(selectedText);
              if (selectedIndex !== -1) {
                startPos = selectedIndex + 1; // +1 for document start
                endPos = startPos + selectedText.length;
              }
            }
          }
        }

        // Final validation
        if (startPos === -1 || endPos === -1 || startPos >= endPos) {
          console.warn('Could not determine valid positions for selection');
          setShowCommentButton(false);
          return;
        }

        const rect = range.getBoundingClientRect();

        setSelection({
          text: selectedText,
          startOffset: startPos,
          endOffset: endPos,
          rect,
        });

        const buttonWidth = 130; // Approximate width of "Add Comment" button
        const buttonHeight = 40; // Approximate height
        const padding = 10;

        // Center it horizontally below the selection
        let buttonX = rect.left + rect.width / 2 - buttonWidth / 2;
        let buttonY = rect.bottom + padding;

        // Handle horizontal overflow
        if (buttonX < padding) {
          buttonX = padding;
        }
        if (buttonX + buttonWidth > window.innerWidth - padding) {
          buttonX = window.innerWidth - buttonWidth - padding;
        }

        // Handle vertical overflow (if selection is at the bottom of the screen)
        if (buttonY + buttonHeight > window.innerHeight - padding) {
          buttonY = rect.top - buttonHeight - padding;
        }

        setCommentButtonPosition({
          x: buttonX,
          y: buttonY,
        });

        setShowCommentButton(true);
      } catch (error) {
        console.error('Error calculating selection position:', error);
        setShowCommentButton(false);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [editor]);

  // Fetch novel data
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch('/api/novels');
        if (!response.ok) {
          throw new Error('Failed to fetch novels');
        }
        const novels = await response.json();
        const foundNovel = novels.find((n: Novel) => n.id === novelId);

        if (!foundNovel) {
          throw new Error('Novel not found');
        }

        setNovel(foundNovel); // This will now include novelAddress and coinTransactionHash

        if (foundNovel.chapters.length > 0) {
          setSelectedChapter(foundNovel.chapters[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (novelId) {
      fetchNovel();
    }
  }, [novelId]);

  // Fetch token balance when novel and session are available
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!novel?.coinAddress || !session?.user?.walletAddress) {
        setTokenBalance(0);
        return;
      }

      try {
        // Create a public client for reading from the blockchain
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
        });

        // Call the balanceOf function directly on the ERC20 contract
        const balance = await publicClient.readContract({
          address: novel.coinAddress as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ],
          functionName: 'balanceOf',
          args: [session.user.walletAddress as `0x${string}`],
        });

        // Convert from wei to ether and set the balance
        const formattedBalance = parseFloat(formatEther(balance));
        setTokenBalance(formattedBalance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        // Set balance to 0 if there's an error
        setTokenBalance(0);
      }
    };

    fetchTokenBalance();
  }, [novel?.coinAddress, session?.user?.walletAddress]);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!selectedChapter) return;

    try {
      const response = await fetch(`/api/requests?chapterId=${selectedChapter.id}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }, [selectedChapter]);

  // Fetch requests when chapter changes
  useEffect(() => {
    fetchRequests();
  }, [selectedChapter, fetchRequests]);

  // Fetch chapter content, comments, and requests when selected chapter changes
  useEffect(() => {
    const fetchChapterContent = async () => {
      if (!selectedChapter) return;

      setContentLoading(true);
      try {
        const [contentResponse, commentsResponse, requestsResponse] = await Promise.all([
          fetch(`/api/chapters/${selectedChapter.id}/content`),
          fetch(`/api/comments?chapterId=${selectedChapter.id}`),
          fetch(`/api/requests?chapterId=${selectedChapter.id}`),
        ]);

        if (!contentResponse.ok) {
          throw new Error('Failed to fetch chapter content');
        }

        const contentData = await contentResponse.json();
        const content = contentData.content || '<p>No content available for this chapter.</p>';

        console.log('Chapter content loaded:', content);

        if (editor) {
          editor.commands.setContent(content);
        }

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setRequests(requestsData);
        }
      } catch (err) {
        console.error('Error fetching chapter content:', err);
        const errorContent = '<p>Error loading chapter content.</p>';
        if (editor) {
          editor.commands.setContent(errorContent);
        }
      } finally {
        setContentLoading(false);
      }
    };

    fetchChapterContent();
  }, [selectedChapter, editor, fetchRequests]);

  const handleAddComment = async (content: string) => {
    if (!selection || !selectedChapter || !session) return;

    setCommentLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          highlightedText: selection.text,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
          textLength: selection.text.length, // Add text length for validation
          chapterId: selectedChapter.id,
        }),
      });

      if (response.status === 409) {
        alert(
          'A comment already exists for this text selection. Please reply to the existing comment instead.'
        );
        setShowCommentSidebar(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      setComments((prev) => [...prev, newComment]);
      setShowCommentDialog(false);
      setShowCommentButton(false);
      setSelection(null);

      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddRequest = async (content: string, bountyAmount: number, stakersReward: number) => {
    if (!selection || !selectedChapter || !session?.user?.id) return;

    setRequestLoading(true);
    setRequestProgressStep(0); // Step 1: Initiating request
    setShowRequestSuccess(false);
    let requestId: string | null = null;

    try {
      // Create request in database first
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          highlightedText: selection.text,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
          textLength: selection.text.length,
          bountyAmount: bountyAmount.toString(),
          stakersReward: stakersReward.toString(),
          chapterId: selectedChapter.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const newRequest = await response.json();
      requestId = newRequest.id;

      // Interact with smart contract
      if (!account || !novel?.novelAddress || !novel?.coinAddress) {
        throw new Error('Smart account, novel contract address, or coin address not available');
      }

      setRequestProgressStep(1); // Step 2: Preparing token transfer

      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
      });

      const novelContract = getContract({
        client,
        chain: {
          ...thirdwebBaseSepolia,
          rpc: process.env.NEXT_PUBLIC_RPC_URL || `https://sepolia.base.org`,
        },
        address: novel.novelAddress as `0x${string}`,
      });

      const tokenContract = getContract({
        client,
        chain: {
          ...thirdwebBaseSepolia,
          rpc: process.env.NEXT_PUBLIC_RPC_URL || `https://sepolia.base.org`,
        },
        address: novel.coinAddress as `0x${string}`,
      });

      // Convert amounts to wei
      const bountyWei = parseEther(bountyAmount.toString());
      const stakersWei = parseEther(stakersReward.toString());
      const totalRequired = bountyWei + stakersWei;

      // Convert request ID to bytes32 format
      if (!requestId) {
        throw new Error('Request ID is required for contract interaction');
      }
      // const bytes = stringToBytes(requestId, { size: 32 });
      // const bountyId = bytesToHex(bytes) as `0x${string}`;
      const bountyId = keccak256(stringToBytes(requestId, { size: 32 }));

      // Step 1: Approve tokens for the novel contract
      const approvalTransaction = approve({
        contract: tokenContract,
        spender: novel.novelAddress as `0x${string}`,
        amount: totalRequired.toString(),
      });

      console.log('Sending approval transaction...');
      const approvalResult = await sendTransaction({
        transaction: approvalTransaction,
        account,
      });
      console.log('Approval transaction sent:', approvalResult.transactionHash);

      setRequestProgressStep(2); // Step 3: Creating bounty

      // Step 2: Create the request bounty
      const bountyTransaction = prepareContractCall({
        contract: novelContract,
        method:
          'function createRequestBounty(bytes32 _bountyId, uint256 _bountyAmount, uint256 _stakersReward) external',
        params: [bountyId, bountyWei, stakersWei],
      });

      console.log('Sending bounty creation transaction...');
      const bountyResult = await sendTransaction({
        transaction: bountyTransaction,
        account,
      });
      console.log('Bounty creation transaction sent:', bountyResult.transactionHash);

      setRequestProgressStep(3); // Step 4: Bounty created

      // Update request with contract details
      const updateResponse = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractBountyId: bountyId, // Add this line to store the contract bounty ID
          transactionHash: bountyResult.transactionHash,
          contractConfirmed: true,
        }),
      });

      if (updateResponse.ok) {
        const updatedRequest = await updateResponse.json();
        setRequests((prev) => [...prev, updatedRequest]);
      }

      // Show success message
      setShowRequestSuccess(true);

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        setShowRequestDialog(false);
        setSelection(null);
        setShowRequestSuccess(false);
        setRequestProgressStep(undefined);
        setShowCommentButton(false);
        window.getSelection()?.removeAllRanges();
      }, 1500);
    } catch (error) {
      console.error('Error creating request:', error);

      // If we created a database entry but contract failed, delete it
      if (requestId) {
        try {
          await fetch(`/api/requests/${requestId}`, {
            method: 'DELETE',
          });
        } catch (deleteError) {
          console.error('Error cleaning up failed request:', deleteError);
        }
      }

      alert(
        `Failed to create request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRequestLoading(false);
      if (!showRequestSuccess) {
        setRequestProgressStep(undefined);
      }
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    if (!session?.user) return;

    // Optimistic update
    const tempReply = {
      id: `temp-${Date.now()}`,
      content,
      user: {
        id: session.user.id || '',
        name: session.user.name || session.user.email || 'You',
        email: session.user.email || '',
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, tempReply] }
          : comment
      )
    );

    try {
      const response = await fetch(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const newReply = await response.json();

      // Replace optimistic reply with real one
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === tempReply.id ? newReply : reply
                ),
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error adding reply:', error);

      // Remove optimistic reply on error
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: comment.replies.filter((reply) => reply.id !== tempReply.id),
              }
            : comment
        )
      );

      alert('Failed to add reply. Please try again.');
      throw error;
    }
  };

  // Add request reply handler
  const handleRequestReply = async (requestId: string, content: string) => {
    if (!session?.user) return;

    // Optimistic update
    const tempReply = {
      id: `temp-${Date.now()}`,
      content,
      user: {
        id: session.user.id || '',
        name: session.user.name || session.user.email || 'You',
        email: session.user.email || '',
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, replies: [...(request.replies || []), tempReply] }
          : request
      )
    );

    try {
      const response = await fetch(`/api/requests/${requestId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to create reply');

      const newReply = await response.json();

      // Replace optimistic reply with real reply
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                replies: [...(request.replies || []).filter((r) => !r.isOptimistic), newReply],
              }
            : request
        )
      );
    } catch (error) {
      console.error('Error creating reply:', error);
      // Remove optimistic reply on error
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                replies: (request.replies || []).filter((r) => !r.isOptimistic),
              }
            : request
        )
      );
      throw error;
    }
  };

  const highlightCommentedText = useCallback(() => {
    if (!editor || (!comments.length && !requests.length)) return;

    // Clear all existing highlights first
    editor.commands.unsetHighlight();

    // Sort comments and requests by start position to avoid conflicts
    const sortedComments = [...comments].sort((a, b) => a.startOffset - b.startOffset);
    const sortedRequests = [...requests].sort((a, b) => a.startOffset - b.startOffset);

    // Apply Tiptap highlighting for each comment (purple)
    sortedComments.forEach((comment) => {
      const { startOffset, endOffset } = comment;

      // Validate positions are within document bounds
      const docSize = editor.state.doc.content.size;
      if (startOffset >= 1 && endOffset <= docSize && startOffset < endOffset) {
        try {
          // Use the exact Tiptap positions stored in the comment
          editor.commands.setTextSelection({ from: startOffset, to: endOffset });
          editor.commands.setHighlight({
            color: '#a855f7', // purple-500 text color only
          });
        } catch (error) {
          console.error('Error applying comment highlight:', error);
        }
      }
    });

    // Apply Tiptap highlighting for each request (green)
    sortedRequests.forEach((request) => {
      const { startOffset, endOffset } = request;

      // Validate positions are within document bounds
      const docSize = editor.state.doc.content.size;
      if (startOffset >= 1 && endOffset <= docSize && startOffset < endOffset) {
        try {
          // Use the exact Tiptap positions stored in the request
          editor.commands.setTextSelection({ from: startOffset, to: endOffset });
          editor.commands.setHighlight({
            color: '#22c55e', // green-500 text color
          });
        } catch (error) {
          console.error('Error applying request highlight:', error);
        }
      }
    });

    // Clear selection after highlighting
    editor.commands.blur();
  }, [editor, comments, requests]);

  // Apply highlighting when comments or requests change
  useEffect(() => {
    if (editor && (comments.length > 0 || requests.length > 0)) {
      highlightCommentedText();
    }
  }, [comments, requests, editor, highlightCommentedText]);

  // Check if current user is the author
  const isAuthor = session?.user?.id === novel?.author?.id;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="text-purple-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-red-600">Error: {error || 'Novel not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`container mx-auto px-4 py-8 pt-24 transition-all duration-300 ${
          showCommentSidebar || showRequestSidebar ? 'mr-96' : ''
        }`}
      >
        <div className="mx-auto max-w-4xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-purple-600 transition-colors duration-150 hover:text-purple-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Stories
            </Link>
          </div>

          {/* Combined Novel Section */}
          {selectedChapter ? (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {/* Header with gradient background */}
              <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">{novel.title}</h1>
                <p className="mb-4 text-gray-600 italic">
                  by {novel.author.name || novel.author.email || 'Anonymous'}
                </p>

                {/* Chapter Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <p className="text-md font-bold text-gray-700">
                      Chapter {selectedChapter?.order || 1} / {novel.chapters.length}:
                    </p>
                    <ChapterDropdown
                      chapters={novel.chapters}
                      selectedChapter={selectedChapter}
                      onSelect={setSelectedChapter}
                      disabled={contentLoading}
                    />
                  </div>
                  {selectedChapter && selectedChapter.wordCount !== undefined && (
                    <p className="text text-gray-600 italic">
                      {selectedChapter.wordCount === 1
                        ? '1 word'
                        : `${selectedChapter.wordCount} words`}
                    </p>
                  )}
                </div>
              </div>

              {/* Content section */}
              <div className="p-8" ref={contentRef}>
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    <p className="text-purple-600">Loading story...</p>
                  </div>
                ) : (
                  <div className="chapter-content relative">
                    <EditorContent editor={editor} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Header only when no chapter selected */
            <div className="mb-6 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-sm">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{novel.title}</h1>
              <p className="mb-4 text-gray-600 italic">
                by {novel.author.name || novel.author.email || 'Anonymous'}
              </p>

              {/* Chapter Selection */}
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <p className="text-md font-bold text-gray-700">
                    Chapter 1 / {novel.chapters.length}:
                  </p>
                  <ChapterDropdown
                    chapters={novel.chapters}
                    selectedChapter={selectedChapter}
                    onSelect={setSelectedChapter}
                    disabled={contentLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* No Chapters Message */}
          {novel.chapters.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">No chapters available for this novel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Comment Button */}
      {showCommentButton && session && (
        <div
          className="fixed z-30 flex flex-col space-y-2"
          style={{
            left: commentButtonPosition.x,
            top: commentButtonPosition.y,
          }}
        >
          {/* Add Request Button (Author Only) */}
          {isAuthor && (
            <button
              onClick={() => setShowRequestDialog(true)}
              className="flex items-center space-x-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white shadow-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Request</span>
            </button>
          )}

          {/* Add Comment Button */}
          <button
            onClick={() => setShowCommentDialog(true)}
            className="flex items-center space-x-2 rounded-lg bg-purple-600 px-3 py-2 text-sm text-white shadow-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Comment</span>
          </button>
        </div>
      )}

      {/* Request Dialog */}
      <RequestDialog
        isOpen={showRequestDialog}
        onClose={() => {
          if (!requestLoading) {
            setShowRequestDialog(false);
            setSelection(null);
            setRequestProgressStep(undefined);
            setShowRequestSuccess(false);
          }
        }}
        selection={selection}
        onSubmit={handleAddRequest}
        loading={requestLoading}
        tokenBalance={tokenBalance}
        coinSymbol={novel?.coinSymbol || 'TOKEN'}
        progressStep={requestProgressStep}
        showSuccess={showRequestSuccess}
      />

      {/* Comment Dialog */}
      <CommentDialog
        isOpen={showCommentDialog}
        onClose={() => {
          setShowCommentDialog(false);
          setShowCommentButton(false);
          setSelection(null);
          window.getSelection()?.removeAllRanges();
        }}
        selection={selection}
        onSubmit={handleAddComment}
        loading={commentLoading}
      />

      {/* Floating Buttons */}
      {!showCommentSidebar && !showRequestSidebar && (
        <div className="fixed right-6 bottom-6 z-40 flex flex-col space-y-3">
          {/* Floating Requests Button */}
          <RequestsButton
            onClick={() => setShowRequestSidebar(!showRequestSidebar)}
            requestCount={requests.length}
            isVisible={true}
          />

          {/* Floating Comments Button */}
          <CommentsButton
            onClick={() => setShowCommentSidebar(!showCommentSidebar)}
            commentCount={comments.length}
            isVisible={true}
          />
        </div>
      )}

      {/* Request Sidebar */}
      <RequestsSidebar
        requests={requests}
        onReply={handleRequestReply}
        replyingTo={replyingToRequest}
        setReplyingTo={setReplyingToRequest}
        isVisible={showRequestSidebar}
        onClose={() => setShowRequestSidebar(false)}
        novel={novel}
        scrollToRequestId={scrollToRequestId}
        onRequestsUpdate={setRequests} // Pass the state setter function
      />

      {/* Comment Sidebar */}
      <CommentsSidebar
        comments={comments}
        onReply={handleReply}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        isVisible={showCommentSidebar}
        onClose={() => setShowCommentSidebar(false)}
        novel={novel}
        scrollToCommentId={scrollToCommentId}
      />

      {/* Custom CSS for TipTap editor content */}
      <style jsx global>{`
        .chapter-content .ProseMirror {
          outline: none;
          color: #111827 !important;
          font-size: 1.125rem;
          line-height: 1.75;
          font-family: 'Georgia', 'Times New Roman', serif;
        }

        .chapter-content .ProseMirror p {
          color: #111827 !important;
          margin-bottom: 1.5rem;
        }

        .chapter-content .ProseMirror h1,
        .chapter-content .ProseMirror h2,
        .chapter-content .ProseMirror h3 {
          color: #111827 !important;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .chapter-content .ProseMirror h1 {
          font-size: 1.875rem;
        }

        .chapter-content .ProseMirror h2 {
          font-size: 1.5rem;
        }

        .chapter-content .ProseMirror h3 {
          font-size: 1.25rem;
        }

        /* Highlighted text styles */
        .chapter-content ::selection {
          background-color: #e9d5ff;
        }

        .chapter-content .ProseMirror mark {
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline !important;
        }

        /* Purple highlighting for comments */
        .chapter-content .ProseMirror mark[data-color='#a855f7'] {
          background-color: #f3e8ff !important;
          color: #a855f7 !important;
          box-shadow: 0 1px 3px rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .chapter-content .ProseMirror mark[data-color='#a855f7']:hover {
          background-color: #e9d5ff !important;
          color: #7c3aed !important;
          box-shadow: 0 2px 6px rgba(168, 85, 247, 0.2);
          transform: translateY(-1px);
        }

        /* Green highlighting for requests */
        .chapter-content .ProseMirror mark[data-color='#22c55e'] {
          background-color: #dcfce7 !important;
          color: #22c55e !important;
          box-shadow: 0 1px 3px rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .chapter-content .ProseMirror mark[data-color='#22c55e']:hover {
          background-color: #bbf7d0 !important;
          color: #16a34a !important;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .highlighted-comment-text {
          background-color: rgb(243 232 255); /* purple-100 */
          color: rgb(168 85 247); /* purple-500 */
          padding: 2px 4px;
          border-radius: 4px;
        }

        .highlighted-request-text {
          background-color: rgb(220 252 231); /* green-100 */
          color: rgb(34 197 94); /* green-500 */
          padding: 2px 4px;
          border-radius: 4px;
        }

        /* Request highlighting in editor */
        .chapter-content .ProseMirror mark[data-color='#22c55e'] {
          background-color: #dcfce7 !important;
          color: #22c55e !important;
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          display: inline !important;
        }

        .chapter-content .ProseMirror mark[data-color='#22c55e']:hover {
          background-color: #bbf7d0 !important;
          color: #16a34a !important;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .fixed.right-0.w-96 {
            width: 100vw;
            right: 0;
          }

          .mr-96 {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
