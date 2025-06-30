'use client';

// NOTE: This implementation uses Tiptap Comments SDK structure following the documented patterns
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Main Component
// Add missing state variables in the main component
import { TiptapCollabProvider } from '@hocuspocus/provider';
import { CommentsKit, subscribeToThreads } from '@tiptap-pro/extension-comments';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChevronDown, ChevronLeft, Loader2, MessageCircle, Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as Y from 'yjs';

// Fixed useUser hook with memoized user object
export const useUser = () => {
  const { data: session } = useSession();

  // Memoize the entire user object to prevent re-renders
  return useMemo(
    () => ({
      name: session?.user?.name || 'Anonymous',
      color: '#8B5CF6', // Fixed purple color
    }),
    [session?.user?.name]
  ); // Only change when user name changes
};

// Threads Context following tiptap docs pattern
// Fix the ThreadsContext type definition
export const ThreadsContext = createContext<{
  threads: any[];
  selectedThreads: any[];
  selectedThread: string | null;
  onClickThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  resolveThread: (threadId: string) => void;
  unresolveThread: (threadId: string) => void;
  onUpdateComment: (threadId: string, commentId: string, content: string) => void;
  onHoverThread: (threadId: string) => void;
  onLeaveThread: () => void;
}>({
  threads: [],
  selectedThreads: [],
  selectedThread: null,
  onClickThread: () => {},
  deleteThread: () => {},
  resolveThread: () => {},
  unresolveThread: () => {},
  onUpdateComment: () => {},
  onHoverThread: () => {},
  onLeaveThread: () => {},
});

export const ThreadsProvider = ({
  children,
  threads = [],
  selectedThreads = [],
  selectedThread = null,
  onClickThread = () => {},
  onDeleteThread = () => {},
  onResolveThread = () => {},
  onUnresolveThread = () => {},
  onUpdateComment = () => {},
  onHoverThread = () => {},
  onLeaveThread = () => {},
}: {
  children: React.ReactNode;
  threads?: any[];
  selectedThreads?: any[];
  selectedThread?: string | null;
  onClickThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onResolveThread?: (threadId: string) => void;
  onUnresolveThread?: (threadId: string) => void;
  onUpdateComment?: (threadId: string, commentId: string, content: string) => void;
  onHoverThread?: (threadId: string) => void;
  onLeaveThread?: () => void;
}) => {
  const providerValue = {
    threads,
    selectedThreads,
    selectedThread,
    onClickThread,
    deleteThread: onDeleteThread,
    resolveThread: onResolveThread,
    unresolveThread: onUnresolveThread,
    onUpdateComment,
    onHoverThread,
    onLeaveThread,
  };

  return <ThreadsContext.Provider value={providerValue}>{children}</ThreadsContext.Provider>;
};

export const useThreadsState = () => {
  return useContext(ThreadsContext);
};

// Comment Card Component following tiptap docs pattern
export const CommentCard = ({
  name,
  createdAt,
  deleted,
  content,
  onEdit,
  onDelete,
  showActions = false,
}: any) => {
  const [isComposing, setIsComposing] = useState(false);
  const [composeValue, setComposeValue] = useState(content);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (onEdit) {
        setIsComposing(false);
        onEdit(composeValue);
      }
    },
    [composeValue, onEdit]
  );

  const commentWrapperClass = ['comment'];
  if (deleted) {
    commentWrapperClass.push('deleted');
  }

  return (
    <div className={`${commentWrapperClass.join(' ')} mb-2 rounded-lg border p-3`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="text-sm">
          <span className="font-medium text-gray-900">{name}</span>
          <span className="ml-2 text-gray-500">{new Date(createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {deleted && (
        <div className="text-gray-500 italic">
          <p>Comment was deleted</p>
        </div>
      )}

      {!isComposing && !deleted ? (
        <div>
          <p className="mb-2 text-gray-900">{content}</p>
          {showActions ? (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsComposing(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              {onDelete ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {isComposing && !deleted ? (
        <div>
          <form onSubmit={handleSubmit}>
            <textarea
              onChange={(e) => setComposeValue(e.currentTarget.value)}
              value={composeValue}
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!composeValue.length || composeValue === content}
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Accept
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

// Thread Card Component following tiptap docs pattern
export const ThreadCard = ({ id, active, open, children, onClick, onClickOutside }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(id);
    }
  }, [id, onClick]);

  useEffect(() => {
    if (!active) {
      return () => null;
    }

    const clickHandler = onClickOutside
      ? (event: MouseEvent) => {
          if (!cardRef.current) {
            return;
          }
          if (!cardRef.current.contains(event.target as Node)) {
            onClickOutside();
          }
        }
      : null;

    if (clickHandler) {
      document.addEventListener('click', clickHandler);
    }

    return () => {
      if (clickHandler) {
        document.removeEventListener('click', clickHandler);
      }
    };
  }, [active, onClickOutside]);

  return (
    <div
      ref={cardRef}
      className={`thread${open ? 'is-open' : ''}${active ? 'is-active' : ''} mb-3 cursor-pointer rounded-lg border p-3 hover:bg-gray-50`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// Thread Composer Component following tiptap docs pattern
export const ThreadComposer = ({ threadId, provider }: any) => {
  const user = useUser();
  const [comment, setComment] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!comment) {
        return;
      }
      if (provider) {
        provider.addComment(threadId, {
          content: comment,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: { userName: user.name },
        });
        setComment('');
      }
    },
    [comment, provider, threadId, user]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        placeholder="Reply to thread …"
        onChange={(e) => setComment(e.currentTarget.value)}
        value={comment}
        className="w-full rounded-md border p-2 text-sm"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={!comment.length}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
};

// Threads List Item Component following tiptap docs pattern
export const ThreadsListItem = ({ thread, provider, active, open }: any) => {
  const {
    onClickThread,
    deleteThread,
    onHoverThread,
    onLeaveThread,
    resolveThread,
    unresolveThread,
  } = useThreadsState();

  const comments = provider?.getThreadComments ? provider.getThreadComments(thread.id, true) : [];
  const firstComment = comments && comments[0];

  const handleDeleteClick = useCallback(() => {
    deleteThread(thread.id);
  }, [thread.id, deleteThread]);

  const handleResolveClick = useCallback(() => {
    resolveThread(thread.id);
  }, [thread.id, resolveThread]);

  const handleUnresolveClick = useCallback(() => {
    unresolveThread(thread.id);
  }, [thread.id, unresolveThread]);

  const editComment = useCallback(
    (commentId: string, val: string) => {
      if (provider?.updateComment) {
        provider.updateComment(thread.id, commentId, { content: val });
      }
    },
    [provider, thread.id]
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      if (provider?.deleteComment) {
        provider.deleteComment(thread.id, commentId, { deleteContent: true });
      }
    },
    [provider, thread.id]
  );

  return (
    <div onMouseEnter={() => onHoverThread(thread.id)} onMouseLeave={() => onLeaveThread()}>
      <ThreadCard id={thread.id} active={active} open={open} onClick={!open ? onClickThread : null}>
        {open ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex space-x-2">
                {!thread.resolvedAt ? (
                  <button
                    onClick={handleResolveClick}
                    className="rounded bg-green-100 px-2 py-1 text-sm text-green-700 hover:bg-green-200"
                  >
                    ✓ Resolve
                  </button>
                ) : (
                  <button
                    onClick={handleUnresolveClick}
                    className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    ⟲ Unresolve
                  </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200"
                >
                  × Delete
                </button>
              </div>
            </div>

            {thread.resolvedAt ? (
              <div className="mb-3 rounded bg-gray-50 p-2 text-sm text-gray-600">
                💡 Resolved at {new Date(thread.resolvedAt).toLocaleDateString()}{' '}
                {new Date(thread.resolvedAt).toLocaleTimeString()}
              </div>
            ) : null}

            <div className="space-y-2">
              {comments.map((comment: any) => (
                <CommentCard
                  key={comment.id}
                  name={comment.data.userName}
                  content={comment.deletedAt ? null : comment.content}
                  createdAt={comment.createdAt}
                  deleted={comment.deletedAt}
                  onEdit={(val: string) => {
                    if (val) {
                      editComment(comment.id, val);
                    }
                  }}
                  onDelete={() => {
                    deleteComment(comment.id);
                  }}
                  showActions={true}
                />
              ))}
            </div>
            <ThreadComposer threadId={thread.id} provider={provider} />
          </>
        ) : null}

        {!open && firstComment && firstComment.data ? (
          <div>
            <CommentCard
              key={firstComment.id}
              name={firstComment.data.userName}
              content={firstComment.content}
              createdAt={firstComment.createdAt}
              deleted={firstComment.deletedAt}
              onEdit={(val: string) => {
                if (val) {
                  editComment(firstComment.id, val);
                }
              }}
            />
            <div className="mt-2 text-xs text-gray-500">
              {Math.max(0, comments.length - 1) || 0}{' '}
              {(comments.length - 1 || 0) === 1 ? 'reply' : 'replies'}
            </div>
          </div>
        ) : null}
      </ThreadCard>
    </div>
  );
};

// Threads List Component following tiptap docs pattern
// Fix the ThreadsList component to properly type the threads
export const ThreadsList = ({ threads, provider }: { threads: any[]; provider: any }) => {
  const { selectedThreads, selectedThread } = useThreadsState();

  if (!provider) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Comments require Tiptap Cloud connection</p>
        <p className="text-sm">Check your environment variables</p>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No comments yet</p>
        <p className="text-sm">Select text and press Ctrl/Cmd+H to add a comment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread: any) => (
        <ThreadsListItem
          key={thread.id}
          thread={thread}
          active={selectedThreads.includes(thread.id) || selectedThread === thread.id}
          open={selectedThread === thread.id}
          provider={provider}
        />
      ))}
    </div>
  );
};

// Fixed useThreads implementation with better error handling
export const useThreads = (provider: any, editor: any, user: any) => {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!provider || !editor) {
      console.log('No provider or editor available for threads');
      setThreads([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Subscribe to threads updates
      const unsubscribe = subscribeToThreads({
        provider,
        callback: (currentThreads: any) => {
          console.log('Threads updated:', currentThreads);
          setThreads(currentThreads || []);
          setIsLoading(false);
        },
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to threads:', error);
      setIsLoading(false);
    }
  }, [provider, editor]);

  const createThread = useCallback(() => {
    if (!editor) {
      alert('Editor not available');
      return;
    }

    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some text to comment on');
      return;
    }

    const input = window.prompt('Enter your comment:');
    if (!input) return;

    try {
      // Create thread with proper selection
      editor
        .chain()
        .focus()
        .setThread({
          content: input,
          commentData: {
            userName: user.name,
            userColor: user.color,
            timestamp: new Date().toISOString(),
          },
        })
        .run();
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Failed to create comment. Please try again.');
    }
  }, [editor, user]);

  return { threads, createThread, isLoading };
};

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

export default function NovelDetail() {
  const params = useParams();
  const novelId = params.id as string;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const commentsPanelRef = useRef<HTMLDivElement>(null);
  const user = useUser();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Create Yjs document
  const ydoc = useMemo(() => new Y.Doc(), []);

  // Check if Tiptap Cloud credentials are available
  const appId = process.env.NEXT_PUBLIC_TIPTAP_APP_ID;
  const token = process.env.NEXT_PUBLIC_TIPTAP_TOKEN;

  // Restore collaboration provider for comments to work
  const collabProvider = useMemo(() => {
    if (!selectedChapter?.id || !appId || !token) return null;

    return new TiptapCollabProvider({
      name: `novel-${novelId}-chapter-${selectedChapter.id}`,
      appId: appId,
      token: token,
      document: ydoc,
    });
  }, [novelId, selectedChapter?.id, ydoc, appId, token]);

  // Fixed editor configuration
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        // Restore collaboration extensions for comments
        ...(collabProvider
          ? [
              CollaborationCursor.configure({
                provider: collabProvider,
                user: {
                  name: user.name,
                  color: user.color,
                },
              }),
              CommentsKit.configure({
                provider: collabProvider,
                useLegacyWrapping: false,
              }),
            ]
          : []),
      ],
      // When collaboration is active, start empty and let provider load everything
      // When no collaboration, use fetched content
      content: collabProvider ? '' : (chapterContent || '<p>Loading...</p>'),
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'prose prose-xl max-w-none focus:outline-none text-gray-900',
        },
      },
    },
    [collabProvider, chapterContent, ydoc]
  );

  // Use the improved useThreads hook
  const { threads, createThread, isLoading } = useThreads(collabProvider, editor, user);

  useEffect(() => {
    if (!collabProvider) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    collabProvider.on('connect', handleConnect);
    collabProvider.on('disconnect', handleDisconnect);

    return () => {
      collabProvider.off('connect', handleConnect);
      collabProvider.off('disconnect', handleDisconnect);
    };
  }, [collabProvider]);

  // Thread management functions following tiptap docs pattern
  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (editor && 'removeThread' in editor.commands) {
        editor.commands.removeThread({
          id: threadId,
          deleteThread: true,
        });
      }
    },
    [editor]
  );

  const handleResolveThread = useCallback(
    (threadId: string) => {
      if (editor && 'resolveThread' in editor.commands) {
        editor.commands.resolveThread({ id: threadId });
      }
    },
    [editor]
  );

  const handleUnresolveThread = useCallback(
    (threadId: string) => {
      if (editor && 'unresolveThread' in editor.commands) {
        editor.commands.unresolveThread({ id: threadId });
      }
    },
    [editor]
  );

  const handleClickThread = useCallback(
    (threadId: string) => {
      if (editor && 'selectThread' in editor.commands) {
        editor.commands.selectThread({ id: threadId });
      }
    },
    [editor]
  );

  const handleHoverThread = useCallback((threadId: string) => {
    // Handle thread hover
  }, []);

  const handleLeaveThread = useCallback(() => {
    // Handle thread leave
  }, []);

  const handleUpdateComment = useCallback(
    (threadId: string, commentId: string, content: string) => {
      if (collabProvider?.updateComment) {
        collabProvider.updateComment(threadId, commentId, { content });
      }
    },
    []
  );

  // Check if text is selected to show create thread button
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    };

    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'h' && hasSelection) {
          event.preventDefault();
          setShowCommentDialog(true);
        }
      }
      if (event.key === 'Escape') {
        setShowCommentDialog(false);
        setNewComment('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasSelection]);

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

        setNovel(foundNovel);

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

  useEffect(() => {
    const fetchChapterContent = async () => {
      if (!selectedChapter) return;

      setContentLoading(true);
      try {
        const response = await fetch(`/api/chapters/${selectedChapter.id}/content`);
        if (!response.ok) {
          throw new Error('Failed to fetch chapter content');
        }
        const data = await response.json();
        setChapterContent(data.content || '');

        // ONLY set content if there's NO collaboration provider
        // When collabProvider exists, let it handle all content including comments
        if (editor && !collabProvider && data.content) {
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(data.content);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error fetching chapter content:', err);
        setChapterContent('<p>Error loading chapter content.</p>');
        if (editor && !collabProvider) {
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent('<p>Error loading chapter content.</p>');
            }
          }, 100);
        }
      } finally {
        setContentLoading(false);
      }
    };

    fetchChapterContent();
  }, [selectedChapter, editor, collabProvider]);

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
    <ThreadsProvider
      threads={threads}
      selectedThreads={[]}
      selectedThread={selectedThread}
      onClickThread={handleClickThread}
      onDeleteThread={handleDeleteThread}
      onResolveThread={handleResolveThread}
      onUnresolveThread={handleUnresolveThread}
      onUpdateComment={handleUpdateComment}
      onHoverThread={handleHoverThread}
      onLeaveThread={handleLeaveThread}
    >
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
                    {/* Chapter Selection */}
                    <ChapterDropdown
                      chapters={novel.chapters}
                      selectedChapter={selectedChapter}
                      onSelect={setSelectedChapter}
                      disabled={contentLoading}
                    />

                    {/* Reader Controls */}
                    <div className="flex items-center space-x-3">
                      {hasSelection && isConnected && (
                        <button
                          onClick={createThread}
                          className="inline-flex items-center space-x-2 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Add Comment</span>
                        </button>
                      )}
                      <button
                        onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                        className="inline-flex items-center space-x-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Comments ({threads.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Connection Status */}
                  {collabProvider && (
                    <div className="mt-4 flex items-center space-x-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {isConnected
                          ? 'Comments will be saved'
                          : 'Connecting to comment service...'}
                      </span>
                    </div>
                  )}

                  {!appId || !token ? (
                    <div className="mt-4 rounded-md bg-yellow-50 p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Tiptap Cloud credentials not found. Comments will not persist across
                        sessions.
                      </p>
                      <p className="mt-1 text-xs text-yellow-600">
                        Add NEXT_PUBLIC_TIPTAP_APP_ID and NEXT_PUBLIC_TIPTAP_TOKEN to your
                        .env.local file
                      </p>
                    </div>
                  ) : null}

                  {/* Instructions */}
                  <div className="mt-4 text-xs text-gray-500">
                    Select text and click "Add Comment" to add comments
                  </div>
                </div>

                {/* Chapter Content */}
                {selectedChapter && (
                  <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedChapter.title}
                      </h2>
                      {selectedChapter.wordCount !== undefined && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedChapter.wordCount === 1
                            ? '1 word'
                            : `${selectedChapter.wordCount} words`}
                        </p>
                      )}
                    </div>

                    <div className="p-8">
                      {contentLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      ) : (
                        <div className="chapter-content">
                          <EditorContent editor={editor} />
                        </div>
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
                <div className="w-80 flex-shrink-0" ref={commentsPanelRef}>
                  <div className="h-full border-l border-gray-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                      <button
                        onClick={() => setCommentsPanelOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="text-gray-500">Loading comments...</div>
                      </div>
                    ) : (
                      <ThreadsList provider={collabProvider} threads={threads} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom CSS for TipTap editor content */}
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

          /* Tiptap Comments styles */
          .chapter-content .ProseMirror .tiptap-thread {
            background-color: #fef08a !important;
            border-radius: 2px;
            padding: 1px 2px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .chapter-content .ProseMirror .tiptap-thread--hovered {
            background-color: #fde047 !important;
          }

          .chapter-content .ProseMirror .tiptap-thread--selected {
            background-color: #e0e7ff !important;
          }

          .chapter-content .ProseMirror .tiptap-thread--unresolved {
            background-color: #fef08a !important;
            border-radius: 2px;
            padding: 1px 2px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .chapter-content .ProseMirror .tiptap-thread--unresolved:hover {
            background-color: #fde047 !important;
          }

          .chapter-content .ProseMirror .tiptap-thread--resolved {
            background-color: #d1fae5 !important;
            opacity: 0.7;
          }

          /* Thread card styles */
          .thread.is-active {
            border-color: #8b5cf6;
            background-color: #f3f4f6;
          }

          .thread.is-open {
            border-color: #8b5cf6;
            background-color: #fafafa;
          }

          /* Comment styles */
          .comment {
            border: 1px solid #e5e7eb;
            background-color: #ffffff;
          }

          .comment.deleted {
            background-color: #f9fafb;
            opacity: 0.7;
          }
        `}</style>
      </div>
    </ThreadsProvider>
  );
}

// Add this component before the NovelDetail component
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
