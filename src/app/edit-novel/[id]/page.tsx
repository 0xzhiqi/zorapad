'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, ChevronDown, Edit3, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

interface Chapter {
  id: string;
  title: string;
  order: number;
  contentUrl?: string;
  contentPath?: string;
  wordCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  seekPublicFeedback: boolean;
  published: boolean;
  coinAddress?: string;
  coinTransactionHash?: string;
  owners?: string;
  payoutRecipient?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  author: {
    id: string;
    name?: string;
    email?: string;
    walletAddress?: string;
  };
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-purple-500/20">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Toggle = ({
  enabled,
  onChange,
  label,
  disabled = false,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 ${
          enabled ? 'bg-purple-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

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

  // Close dropdown when clicking outside
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
            ? `${selectedChapter.title} (Ch. ${selectedChapter.order})`
            : 'Select a chapter to edit'}
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
                  Chapter {chapter.order} • {chapter.wordCount} words
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

const ChapterEditor = ({
  chapter,
  onSave,
  onCancel,
  isLoading,
}: {
  chapter: Chapter | null;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Load chapter content when chapter changes
  useEffect(() => {
    const loadContent = async () => {
      if (!chapter) {
        // Creating new chapter - start with empty content
        setTitle('');
        setEditorContent('');
        return;
      }

      // Set title immediately
      setTitle(chapter.title || '');

      // Load content from Google Cloud Storage if contentUrl exists
      if (chapter.contentUrl) {
        setLoadingContent(true);
        try {
          const response = await fetch(`/api/chapters/${chapter.id}/content`);
          if (response.ok) {
            const data = await response.json();
            setEditorContent(data.content || '');
          } else {
            console.error('Failed to load chapter content:', response.statusText);
            setEditorContent('');
          }
        } catch (error) {
          console.error('Error loading chapter content:', error);
          setEditorContent('');
        } finally {
          setLoadingContent(false);
        }
      } else {
        // No content URL, start with empty content
        setEditorContent('');
      }
    };

    loadContent();
  }, [chapter]);

  const handleSave = () => {
    onSave(title, editorContent);
  };

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
  };

  if (loadingContent) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading chapter content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={chapter ? 'Chapter title' : 'Enter new chapter title'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <div className="ml-4 flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {chapter ? 'Save' : 'Create Chapter'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white">
        <SimpleEditor
          content={editorContent}
          onChange={handleContentChange}
          placeholder={
            chapter ? 'Continue writing your chapter...' : 'Start writing your new chapter...'
          }
        />
      </div>

      {/* Chapter info - only show for existing chapters */}
      {chapter && (
        <div className="text-sm text-gray-500">
          Chapter {chapter.order} • {chapter.wordCount} words
          {chapter.contentUrl && (
            <span className="ml-2 text-green-600">• Saved to Google Cloud Storage</span>
          )}
        </div>
      )}
    </div>
  );
};

export default function EditNovelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'published' | 'seekPublicFeedback' | 'deleteChapter' | null;
    newValue?: boolean;
    chapterId?: string;
  }>({ isOpen: false, type: null });

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/novels/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Novel not found');
          } else {
            setError('Failed to fetch novel data');
          }
          return;
        }

        const novelData = await response.json();
        setNovel(novelData);
      } catch (err) {
        setError('An error occurred while fetching the novel');
        console.error('Error fetching novel:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNovel();
    }
  }, [id]);

  const handleToggle = (type: 'published' | 'seekPublicFeedback', currentValue: boolean) => {
    const newValue = !currentValue;
    setConfirmModal({
      isOpen: true,
      type,
      newValue,
    });
  };

  const handleCreateChapter = () => {
    setIsCreatingChapter(true);
    setSelectedChapter(null);
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsCreatingChapter(false);
  };

  const handleDeleteChapter = (chapterId: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'deleteChapter',
      chapterId,
    });
  };

  const handleSaveChapter = async (title: string, content: string) => {
    if (!novel) return;

    setUpdateLoading(true);
    try {
      if (selectedChapter) {
        // Updating existing chapter - need to update both title and content

        // 1. Update title in MongoDB
        const titleResponse = await fetch(`/api/chapters/${selectedChapter.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        });

        if (!titleResponse.ok) {
          throw new Error('Failed to update chapter title');
        }

        // 2. Update content in Google Cloud Storage
        const contentResponse = await fetch(`/api/chapters/${selectedChapter.id}/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!contentResponse.ok) {
          throw new Error('Failed to update chapter content');
        }
      } else {
        // Creating new chapter - use the existing logic
        const url = `/api/novels/${id}/chapters`;
        const method = 'POST';

        const body = {
          title,
          content,
          order: (novel.chapters?.length || 0) + 1,
        };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error('Failed to create chapter');
        }
      }

      // Refresh novel data to get updated chapters
      const novelResponse = await fetch(`/api/novels/${id}`);
      if (novelResponse.ok) {
        const updatedNovel = await novelResponse.json();
        setNovel(updatedNovel);

        // Update selected chapter with the saved data
        if (isCreatingChapter) {
          // For new chapters, find the newly created chapter
          const newChapter = updatedNovel.chapters.find(
            (c: Chapter) => c.title === title && c.order === (novel.chapters?.length || 0) + 1
          );
          if (newChapter) {
            setSelectedChapter(newChapter);
          }
          setIsCreatingChapter(false);
        } else {
          // Find and update the selected chapter
          const updatedChapter = updatedNovel.chapters.find(
            (c: Chapter) => c.id === selectedChapter?.id
          );
          if (updatedChapter) {
            setSelectedChapter(updatedChapter);
          }
        }
      }
    } catch (err) {
      console.error('Error saving chapter:', err);
      setError('Failed to save chapter');
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmUpdate = async () => {
    if (!novel || !confirmModal.type) return;

    setUpdateLoading(true);
    try {
      if (confirmModal.type === 'deleteChapter' && confirmModal.chapterId) {
        const response = await fetch(`/api/chapters/${confirmModal.chapterId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete chapter');
        }

        // Refresh novel data
        const novelResponse = await fetch(`/api/novels/${id}`);
        if (novelResponse.ok) {
          const updatedNovel = await novelResponse.json();
          setNovel(updatedNovel);
        }
      } else {
        const updateData = {
          [confirmModal.type]: confirmModal.newValue,
        };

        const response = await fetch(`/api/novels/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('Failed to update novel');
        }

        const updatedNovel = await response.json();
        setNovel(updatedNovel);
      }

      setConfirmModal({ isOpen: false, type: null });
    } catch (err) {
      console.error('Error updating:', err);
      setError('Failed to update');
    } finally {
      setUpdateLoading(false);
    }
  };

  const closeModal = () => {
    setConfirmModal({ isOpen: false, type: null });
  };

  const getModalContent = () => {
    if (!confirmModal.type) return { title: '', message: '' };

    if (confirmModal.type === 'deleteChapter') {
      const chapter = novel?.chapters?.find((c) => c.id === confirmModal.chapterId);
      return {
        title: 'Delete Chapter',
        message: `Are you sure you want to delete "${chapter?.title}"? This action cannot be undone.`,
      };
    }

    const action = confirmModal.newValue ? 'enable' : 'disable';

    if (confirmModal.type === 'published') {
      return {
        title: `${confirmModal.newValue ? 'Publish' : 'Unpublish'} Novel`,
        message: `Are you sure you want to ${action} publishing for "${novel?.title}"? This will ${confirmModal.newValue ? 'make the novel visible to the public' : 'hide the novel from public view'}.`,
      };
    } else {
      return {
        title: `${confirmModal.newValue ? 'Enable' : 'Disable'} Public Feedback`,
        message: `Are you sure you want to ${action} public feedback for "${novel?.title}"? This will ${confirmModal.newValue ? 'allow users to provide feedback' : 'prevent users from providing feedback'}.`,
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 bg-gray-100 px-4 py-2 font-semibold text-gray-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900">Edit Novel</h1>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                <div className="text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    <p className="text-gray-500">Loading novel...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 bg-gray-100 px-4 py-2 font-semibold text-gray-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900">Edit Novel</h1>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                <div className="text-center">
                  <p className="text-red-500">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 bg-gray-100 px-4 py-2 font-semibold text-gray-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900">Edit Novel</h1>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                <div className="text-center">
                  <p className="text-gray-500">Novel not found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modalContent = getModalContent();
  const sortedChapters = novel.chapters?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            {/* Header with title, toggles, chapter dropdown, and add button */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 bg-gray-100 px-4 py-2 font-semibold text-gray-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">{novel.title}</h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* Novel Settings Toggles */}
                <Toggle
                  enabled={novel.published}
                  onChange={() => handleToggle('published', novel.published)}
                  label="Published"
                  disabled={updateLoading}
                />
                <Toggle
                  enabled={novel.seekPublicFeedback}
                  onChange={() => handleToggle('seekPublicFeedback', novel.seekPublicFeedback)}
                  label="Public Feedback"
                  disabled={updateLoading}
                />

                {/* Chapter Dropdown */}
                <ChapterDropdown
                  chapters={sortedChapters}
                  selectedChapter={selectedChapter}
                  onSelect={handleSelectChapter}
                  disabled={updateLoading}
                />

                {/* Add Chapter Button */}
                <button
                  onClick={handleCreateChapter}
                  disabled={isCreatingChapter || updateLoading}
                  className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chapter
                </button>
              </div>
            </div>

            {/* Chapter Editor */}
            <div className="space-y-6">
              {selectedChapter || isCreatingChapter ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isCreatingChapter ? 'Create New Chapter' : 'Edit Chapter'}
                    </h2>
                    {selectedChapter && (
                      <button
                        onClick={() => handleDeleteChapter(selectedChapter.id)}
                        disabled={updateLoading}
                        className="flex items-center rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <ChapterEditor
                    chapter={selectedChapter}
                    onSave={handleSaveChapter}
                    onCancel={() => {
                      setSelectedChapter(null);
                      setIsCreatingChapter(false);
                    }}
                    isLoading={updateLoading}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                  <div className="text-center">
                    <Edit3 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {sortedChapters.length > 0
                        ? 'Select a chapter to edit'
                        : 'Create your first chapter'}
                    </h3>
                    <p className="mt-2 text-gray-500">
                      {sortedChapters.length > 0
                        ? 'Choose a chapter from the dropdown or create a new one to start writing.'
                        : 'Click "Add Chapter" to begin writing your novel.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeModal}
        onConfirm={confirmUpdate}
        title={modalContent.title}
        message={modalContent.message}
        isLoading={updateLoading}
      />
    </div>
  );
}
