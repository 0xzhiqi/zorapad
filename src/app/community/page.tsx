'use client';

import { useEffect, useState } from 'react';

import { BookOpen } from 'lucide-react';

import CommunityNovelCard from './components/CommunityNovelCard';

interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  coinAddress?: string;
  author: {
    id: string;
    name?: string;
    email?: string;
  };
  chapters: {
    id: string;
    title: string;
    wordCount?: number;
  }[];
  coinData?: {
    marketCap: string;
    volume24h: string;
    uniqueHolders: number;
  };
  updatedAt: string;
}

export default function CommunityPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const response = await fetch('/api/novels');
        if (!response.ok) {
          throw new Error('Failed to fetch novels');
        }
        const data = await response.json();
        setNovels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Loading novels seeking feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Add top padding to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 rounded-3xl border border-white/20 bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-indigo-900/10 p-8 backdrop-blur-sm">
            <div className="mb-4 flex items-center space-x-3">
              <h1 className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
                Community Novels
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Discover novels in progress seeking public feedback from the community
            </p>
          </div>

          {/* Content */}
          {novels.length === 0 ? (
            <div className="rounded-3xl bg-white/50 py-12 text-center backdrop-blur-sm">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg text-gray-500">No novels seeking public feedback found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {novels.map((novel) => (
                <CommunityNovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
