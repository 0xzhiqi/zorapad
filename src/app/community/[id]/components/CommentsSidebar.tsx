import { useEffect, useRef, useState } from 'react';

import { Loader2, MessageCircle, Reply, Send, X } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string; // Changed from email: string to email?: string
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
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
                        <p className="mb-1 text-xs font-medium text-purple-700">Referenced text:</p>
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

                        {/* Reply button */}
                        <div className="mt-3 flex justify-end">
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
                                    {(reply.user.name || reply.user.email || 'A')[0].toUpperCase()}
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
                              {/* <span className="text-xs text-gray-400">Cmd+Enter to send</span> */}
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
  );
}
