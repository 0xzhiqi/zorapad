'use client';

import { useEffect, useState } from 'react';

import { BookOpen } from 'lucide-react';

import NovelCard from './components/NovelCard';
import TradingModal from './components/TradingModal';
import { Novel } from './components/types';

export default function ExplorePage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const response = await fetch('/api/novels/published');
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

  const handleTradeClick = (novel: Novel) => {
    setSelectedNovel(novel);
    setShowTradingModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Loading published novels...</p>
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
                Explore Novels
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Discover novels published by the community and invest in their coins
            </p>
          </div>

          {novels.length === 0 ? (
            <div className="rounded-3xl bg-white/50 py-12 text-center backdrop-blur-sm">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg text-gray-500">No published novels found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} onTradeClick={handleTradeClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trading Modal */}
      {selectedNovel && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedNovel(null);
          }}
          novel={selectedNovel}
        />
      )}
    </div>
  );
}
