import { useEffect, useRef, useState } from 'react';

import { DollarSign, Loader2, MessageCircleQuestion, Reply, Send, Users, X } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string; // Changed from email: string to email?: string
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
  user: User;
  createdAt: string;
  startOffset: number;
  endOffset: number;
  bountyAmount: string; // Changed from number to string
  stakersReward: string; // Changed from number to string
  replies: RequestReply[];
}

interface Novel {
  id: string;
  title: string;
  author: User;
  coinSymbol?: string;
}

interface RequestsSidebarProps {
  requests: Request[];
  onReply: (requestId: string, content: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  isVisible: boolean;
  onClose: () => void;
  novel: Novel | null;
  scrollToRequestId?: string | null;
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

export default function RequestsSidebar({
  requests,
  onReply,
  replyingTo,
  setReplyingTo,
  isVisible,
  onClose,
  novel,
  scrollToRequestId,
}: RequestsSidebarProps) {
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const requestRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // Auto-scroll to specific request when scrollToRequestId changes
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

  const handleReplySubmit = async (requestId: string) => {
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
      await onReply(requestId, originalContent);
    } catch (error) {
      // Revert on error
      setReplyContent(originalContent);
      setReplyingTo(requestId);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!isVisible) return null;

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
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs">{requests.length}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors duration-200 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Requests content - Scrollable area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-6 pb-20">
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircleQuestion className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No requests yet.</p>
              <p className="mt-1 text-xs text-gray-400">Authors can select text to add requests!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request, index) => {
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
                              color: 'rgb(34 197 94)',
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
                        <div className="mb-3 flex items-center space-x-4 rounded-lg bg-green-50 p-3">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Bounty: {request.bountyAmount} {novel?.coinSymbol || 'TOKEN'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Stakers: {request.stakersReward} {novel?.coinSymbol || 'TOKEN'}
                            </span>
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

                    {/* Replies */}
                    {request.replies.length > 0 && (
                      <div className="mt-3 ml-6 space-y-3">
                        {request.replies.map((reply) => {
                          const replyDateTime = formatDateTime(reply.createdAt);
                          return (
                            <div
                              key={reply.id}
                              className={`rounded-lg border-l-4 border-green-200 bg-gray-50 p-3 ${
                                reply.isOptimistic ? 'animate-pulse opacity-70' : ''
                              }`}
                            >
                              <p className="mb-2 text-sm text-gray-800">{reply.content}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-xs text-white">
                                    {(reply.user.name || reply.user.email || 'A')[0].toUpperCase()}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {reply.user.name || reply.user.email}
                                    {novel && reply.user.id === novel.author.id && (
                                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                        Author
                                      </span>
                                    )}
                                    {reply.isOptimistic && (
                                      <span className="ml-1 text-green-500 italic">Sending...</span>
                                    )}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">{replyDateTime.date}</div>
                                  <div className="text-xs text-gray-400">{replyDateTime.time}</div>
                                </div>
                              </div>
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
                              {/* <span className="text-xs text-gray-400">Cmd+Enter to send</span> */}
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
  );
}
