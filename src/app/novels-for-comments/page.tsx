'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChevronDown, ChevronLeft, Loader2, MessageCircle, Plus, Reply, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Interfaces
interface Chapter {
  id: string;
  title: string;
  wordCount?: number;
  order?: number;
  contentUrl?: string;
}

interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  author: {
    id: string;
    name?: string;
    email?: string;
  };
  chapters: Chapter[];
}

interface Comment {
  id: string;
  content: string;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  isAuthorComment: boolean;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Custom hook for user session
export const useUser = () => {
  const { data: session } = useSession();
  return useMemo(
    () => ({
      id: session?.user?.id || '',
      name: session?.user?.name || 'Anonymous',
      email: session?.user?.email || '',
    }),
    [session?.user]
  );
};

// Comment Dialog Component
const CommentDialog = ({
  isOpen,
  onClose,
  highlightedText,
  onSubmit,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  highlightedText: string;
  onSubmit: (content: string) => void;
  loading?: boolean;
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  if (!isOpen) return null;

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

        <div className="mb-4 rounded-md bg-purple-50 p-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Selected text:</span>
          </p>
          <p className="mt-1 text-sm text-purple-700 italic">"{highlightedText}"</p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment..."
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            rows={4}
            disabled={loading}
            autoFocus
          />

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="flex items-center space-x-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
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

// Comment Card Component
const CommentCard = ({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {comment.user.name || comment.user.email || 'Anonymous'}
          </span>
          {comment.isAuthorComment && (
            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
              Author
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-700">{comment.content}</p>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-800"
        >
          <Reply className="h-3 w-3" />
          <span>Reply</span>
        </button>
        {comment.replies.length > 0 && (
          <span className="text-xs text-gray-500">
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            rows={2}
            disabled={submitting}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim() || submitting}
              className="flex items-center space-x-1 rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Reply</span>
            </button>
          </div>
        </form>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function NovelDetail() {
  const params = useParams();
  const novelId = params.id as string;
  const user = useUser();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Comment dialog state
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [textSelection, setTextSelection] = useState<{ start: number; end: number } | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showAddCommentButton, setShowAddCommentButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const editorRef = useRef<HTMLDivElement>(null);

  // Editor configuration
  const editor = useEditor({
    extensions: [StarterKit],
    content: chapterContent || '<p>Loading...</p>',
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-xl max-w-none focus:outline-none text-gray-900',
      },
    },
  });

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowAddCommentButton(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText && editorRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(selectedText);
        setTextSelection({
          start: range.startOffset,
          end: range.endOffset,
        });

        // Position the button near the selection
        const rect = range.getBoundingClientRect();
        setButtonPosition({
          x: rect.right + 10,
          y: rect.top + window.scrollY,
        });
        setShowAddCommentButton(true);
      } else {
        setShowAddCommentButton(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Fetch novel data
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}`);
        if (!response.ok) throw new Error('Failed to fetch novel');

        const data = await response.json();
        setNovel(data.novel);

        if (data.novel.chapters.length > 0) {
          setSelectedChapter(data.novel.chapters[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (novelId) fetchNovel();
  }, [novelId]);

  // Fetch chapter content
  useEffect(() => {
    const fetchChapterContent = async () => {
      if (!selectedChapter) return;

      setContentLoading(true);
      try {
        const response = await fetch(`/api/chapters/${selectedChapter.id}/content`);
        if (!response.ok) throw new Error('Failed to fetch chapter content');

        const data = await response.json();
        const content = data.content || '';
        setChapterContent(content);
      } catch (err) {
        console.error('Error fetching chapter content:', err);
        setChapterContent('<p>Error loading chapter content.</p>');
      } finally {
        setContentLoading(false);
      }
    };

    fetchChapterContent();
  }, [selectedChapter]); // Only depend on selectedChapter

  // Update editor content when chapterContent or editor changes
  useEffect(() => {
    if (editor && chapterContent !== undefined) {
      // Force editor to update content
      editor.commands.setContent(chapterContent);
    }
  }, [editor, chapterContent]);

  // Fetch comments for selected chapter
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedChapter) return;

      setCommentsLoading(true);
      try {
        const response = await fetch(`/api/comments?chapterId=${selectedChapter.id}`);
        if (!response.ok) throw new Error('Failed to fetch comments');

        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [selectedChapter]);

  // Handle comment submission
  const handleCommentSubmit = async (content: string) => {
    if (!selectedChapter || !textSelection) return;

    setCommentSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          highlightedText: selectedText,
          startOffset: textSelection.start,
          endOffset: textSelection.end,
          chapterId: selectedChapter.id,
        }),
      });

      if (response.status === 409) {
        const data = await response.json();
        alert(
          'A comment already exists for this text selection. Please reply to the existing thread instead.'
        );
        return;
      }

      if (!response.ok) throw new Error('Failed to create comment');

      // Refresh comments
      const commentsResponse = await fetch(`/api/comments?chapterId=${selectedChapter.id}`);
      if (commentsResponse.ok) {
        const data = await commentsResponse.json();
        setComments(data.comments || []);
      }

      setShowCommentDialog(false);
      setShowAddCommentButton(false);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error('Error creating comment:', err);
      alert('Failed to create comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to create reply');

      // Refresh comments
      if (selectedChapter) {
        const commentsResponse = await fetch(`/api/comments?chapterId=${selectedChapter.id}`);
        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          setComments(data.comments || []);
        }
      }
    } catch (err) {
      console.error('Error creating reply:', err);
      alert('Failed to create reply. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-red-600">Error: {error || 'Novel not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-7xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/novels-in-progress"
              className="inline-flex items-center gap-2 text-purple-600 transition-colors duration-150 hover:text-purple-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Novels
            </Link>
          </div>

          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Novel Header */}
              <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">{novel.title}</h1>
                <p className="mb-4 text-gray-600">
                  by {novel.author.name || novel.author.email || 'Anonymous'}
                </p>

                {/* Chapter Selection and Controls */}
                <div className="flex items-center justify-between">
                  <ChapterDropdown
                    chapters={novel.chapters}
                    selectedChapter={selectedChapter}
                    onSelect={setSelectedChapter}
                    disabled={contentLoading}
                  />

                  <button
                    onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                    className="inline-flex items-center space-x-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Comments ({comments.length})</span>
                  </button>
                </div>
              </div>

              {/* Chapter Content */}
              {selectedChapter && (
                <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedChapter.title}</h2>
                    {selectedChapter.wordCount !== undefined && (
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedChapter.wordCount === 1
                          ? '1 word'
                          : `${selectedChapter.wordCount} words`}
                      </p>
                    )}
                  </div>

                  <div className="relative p-8" ref={editorRef}>
                    {contentLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      </div>
                    ) : (
                      <div className="chapter-content">
                        <EditorContent editor={editor} />
                      </div>
                    )}

                    {/* Add Comment Button */}
                    {showAddCommentButton && (
                      <button
                        onClick={() => setShowCommentDialog(true)}
                        className="fixed z-10 flex items-center space-x-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-purple-700"
                        style={{
                          left: `${buttonPosition.x}px`,
                          top: `${buttonPosition.y}px`,
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Comment</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* No Chapters Message */}
              {novel.chapters.length === 0 && (
                <div className="rounded-lg bg-white p-12 text-center shadow-lg">
                  <p className="text-gray-500">No chapters available for this novel.</p>
                </div>
              )}
            </div>

            {/* Comments Panel */}
            {commentsPanelOpen && (
              <div className="w-80 flex-shrink-0 lg:w-96">
                <div className="h-full rounded-lg bg-white p-4 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                    <button
                      onClick={() => setCommentsPanelOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {commentsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No comments yet</p>
                      <p className="text-sm">Select text to add the first comment</p>
                    </div>
                  ) : (
                    <div className="max-h-96 space-y-4 overflow-y-auto">
                      {comments.map((comment) => (
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          onReply={handleReplySubmit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      <CommentDialog
        isOpen={showCommentDialog}
        onClose={() => setShowCommentDialog(false)}
        highlightedText={selectedText}
        onSubmit={handleCommentSubmit}
        loading={commentSubmitting}
      />

      {/* Custom CSS */}
      <style jsx global>{`
        .chapter-content .ProseMirror {
          outline: none;
          color: #111827 !important;
          font-size: 1.125rem;
          line-height: 1.75;
        }

        .chapter-content .ProseMirror p {
          color: #111827 !important;
          margin-bottom: 1rem;
        }

        /* Highlighted text styles */
        .chapter-content .ProseMirror ::selection {
          background-color: #e0e7ff !important; /* purple-100 */
        }

        .chapter-content .ProseMirror ::-moz-selection {
          background-color: #e0e7ff !important; /* purple-100 */
        }

        /* Commented text styles */
        .commented-text {
          background-color: #e0e7ff !important; /* purple-100 */
          color: #7c3aed !important; /* purple-400 */
          border-radius: 2px;
          padding: 1px 2px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .commented-text:hover {
          background-color: #c7d2fe !important; /* purple-200 */
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .flex.gap-6 {
            flex-direction: column;
            gap: 1rem;
          }

          .w-80.flex-shrink-0 {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Chapter Dropdown Component
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
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex min-w-[200px] items-center justify-between space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        <span className="truncate text-gray-700">
          {selectedChapter
            ? `${selectedChapter.title}${selectedChapter.order ? ` (Ch. ${selectedChapter.order})` : ''}`
            : 'Select a chapter to read'}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg backdrop-blur-sm">
          <div className="max-h-60 overflow-y-auto bg-white py-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => {
                  onSelect(chapter);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  selectedChapter?.id === chapter.id
                    ? 'border-l-4 border-purple-500 bg-purple-50'
                    : ''
                }`}
              >
                <div className="font-medium text-gray-900">{chapter.title}</div>
                <div className="text-xs text-gray-500">
                  {chapter.order ? `Chapter ${chapter.order} • ` : ''}
                  {chapter.wordCount || 0} words
                  {chapter.contentUrl ? ' • Has content' : ' • Empty'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
