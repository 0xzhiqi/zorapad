'use client';

import { useEffect, useRef, useState } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChevronDown, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
        <span className="truncate text-gray-700">
          {selectedChapter
            ? `${selectedChapter.title}${selectedChapter.order ? ` (Ch. ${selectedChapter.order})` : ''}`
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
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function NovelDetailPage() {
  const params = useParams();
  const novelId = params?.id as string;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize TipTap editor for reading
  const editor = useEditor({
    extensions: [StarterKit],
    content: chapterContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
  });

  // Fetch novel data
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch novel');
        }
        const data = await response.json();
        setNovel(data);

        // Auto-select first chapter
        if (data.chapters.length > 0) {
          const sortedChapters = data.chapters.sort(
            (a: Chapter, b: Chapter) => (a.order || 0) - (b.order || 0)
          );
          setSelectedChapter(sortedChapters[0]);
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

  // Fetch chapter content when selected chapter changes
  useEffect(() => {
    const fetchChapterContent = async () => {
      if (!selectedChapter) return;

      setContentLoading(true);
      try {
        const response = await fetch(`/api/chapters/${selectedChapter.id}/content`);

        if (!response.ok) {
          throw new Error('Failed to fetch chapter content');
        }

        const contentData = await response.json();
        const content = contentData.content || '<p>No content available for this chapter.</p>';

        setChapterContent(content);

        if (editor) {
          editor.commands.setContent(content);
        }
      } catch (err) {
        console.error('Error fetching chapter content:', err);
        const errorContent = '<p>Error loading chapter content.</p>';
        setChapterContent(errorContent);
        if (editor) {
          editor.commands.setContent(errorContent);
        }
      } finally {
        setContentLoading(false);
      }
    };

    fetchChapterContent();
  }, [selectedChapter, editor]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-4xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-purple-600 transition-colors duration-150 hover:text-purple-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Novels
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
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
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

      {/* Custom CSS for clean reading experience */}
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

        .chapter-content ::selection {
          background-color: #ddd6fe;
        }

        @media (max-width: 768px) {
          .chapter-content .ProseMirror {
            font-size: 1rem;
            line-height: 1.6;
          }
        }
      `}</style>
    </div>
  );
}
