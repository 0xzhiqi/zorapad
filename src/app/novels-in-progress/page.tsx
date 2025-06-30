'use client';

import { useEffect, useState } from 'react';

import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
}

const formatNumber = (num: string | number) => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export default function NovelsInProgress() {
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Add top padding to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900">Novels in Progress</h1>
            <p className="text-gray-600">
              Discover novels seeking public feedback from the community
            </p>
          </div>

          {/* Content */}
          {novels.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-lg">
              <p className="text-gray-500">No novels seeking public feedback found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Chapters
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Coin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Market Cap
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        24h Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Holders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {novels.map((novel) => (
                      <tr
                        key={novel.id}
                        className="transition-colors duration-150 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/novels-in-progress/${novel.id}`}
                            className="font-medium text-purple-600 transition-colors duration-150 hover:text-purple-800"
                          >
                            {novel.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {novel.author.name || novel.author.email || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {novel.chapters.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {novel.coinAddress ? (
                            <a
                              href={`https://testnet.zora.co/coin/bsep:${novel.coinAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 transition-colors duration-150 hover:bg-purple-200"
                            >
                              {novel.coinSymbol}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              {novel.coinSymbol}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {novel.coinData ? `$${formatNumber(novel.coinData.marketCap)}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {novel.coinData ? `$${formatNumber(novel.coinData.volume24h)}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {novel.coinData ? formatNumber(novel.coinData.uniqueHolders) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
