'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

interface Author {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  published: boolean;
  order: number;
}

interface CoinData {
  marketCap: string;
  volume24h: string;
  uniqueHolders: number;
}

interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  coinAddress: string | null;
  novelAddress: string | null;
  published: boolean;
  author: Author;
  chapters: Chapter[];
  coinData: CoinData | null;
  createdAt: string;
  updatedAt: string;
}

export default function NovelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const novelId = params.id as string;
  const coinAddress = searchParams.get('coinAddress');
  const novelAddress = searchParams.get('novelAddress');

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch novel');
        }
        const data = await response.json();
        setNovel(data);
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

  const handleCoinClick = () => {
    if (coinAddress) {
      window.open(`https://testnet.zora.co/coin/bsep:${coinAddress}`, '_blank');
    }
  };

  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading novel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <Link
            href="/explore"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Novel not found</p>
          <Link
            href="/explore"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/explore" className="font-medium text-blue-600 hover:text-blue-800">
            ← Back to Explore
          </Link>
        </div>

        {/* Novel Header */}
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{novel.title}</h1>

          {/* Author Info */}
          <div className="mb-6">
            <p className="text-lg text-gray-600">
              <span className="font-medium">Author:</span> {novel.author.name}
            </p>
            {novel.author.walletAddress && (
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Wallet:</span> {novel.author.walletAddress}
              </p>
            )}
          </div>

          {/* Coin Information */}
          <div className="mb-6 rounded-lg bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Associated Coin</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Coin Name:</span> {novel.coinName}
                </p>
                <button
                  onClick={handleCoinClick}
                  className="cursor-pointer text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
                  disabled={!coinAddress}
                >
                  {novel.coinSymbol}
                </button>
                {coinAddress && <p className="mt-1 text-xs text-gray-500">Click to view on Zora</p>}
              </div>

              {novel.coinData && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Market Cap</p>
                    <p className="text-lg font-semibold">
                      ${formatNumber(novel.coinData.marketCap)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">24h Volume</p>
                    <p className="text-lg font-semibold">
                      ${formatNumber(novel.coinData.volume24h)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Holders</p>
                    <p className="text-lg font-semibold">{novel.coinData.uniqueHolders}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Addresses (for future use) */}
          {(coinAddress || novelAddress) && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Contract Information</h3>
              {coinAddress && (
                <p className="mb-1 text-sm text-gray-600">
                  <span className="font-medium">Coin Address:</span>
                  <span className="ml-2 font-mono text-xs">{coinAddress}</span>
                </p>
              )}
              {novelAddress && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Novel Address:</span>
                  <span className="ml-2 font-mono text-xs">{novelAddress}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Chapters Section */}
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Chapters ({novel.chapters.length})
          </h2>

          {novel.chapters.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No chapters available</p>
          ) : (
            <div className="space-y-4">
              {novel.chapters
                .sort((a, b) => a.order - b.order)
                .map((chapter) => (
                  <div
                    key={chapter.id}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Chapter {chapter.order}: {chapter.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">{chapter.wordCount} words</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {chapter.published ? (
                          <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Published: {new Date(novel.createdAt).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(novel.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
