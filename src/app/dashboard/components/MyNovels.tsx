'use client';

import { useEffect, useState } from 'react';

import { BookOpenText, Check, Loader2, Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  author: {
    id: string;
    name?: string;
    email?: string;
    walletAddress?: string;
  };
  coinData?: {
    marketCap: string;
    volume24h: string;
    uniqueHolders: number;
  };
}

const MyNovels = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNovels = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/novels/user');

        if (!response.ok) {
          throw new Error('Failed to fetch novels');
        }

        const novelsData = await response.json();
        setNovels(novelsData);
      } catch (err) {
        setError('Failed to load novels');
        console.error('Error fetching novels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [session]);

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

  const handleNovelClick = (novelId: string) => {
    router.push(`/edit-novel/${novelId}`);
  };

  const BooleanIndicator = ({ value }: { value: boolean }) => (
    <div className="flex items-center justify-start">
      {value ? (
        <div className="flex h-6 items-center justify-center rounded-full bg-green-100 p-1">
          <Check className="h-3 w-3 text-green-800" />
        </div>
      ) : (
        <div className="flex h-6 items-center justify-center rounded-full bg-gray-100 p-1">
          <X className="h-3 w-3 text-gray-600" />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="mb-4 flex items-center space-x-2">
            <BookOpenText className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">My Novels</h2>
          </div>
          <button
            onClick={() => router.push('./launch-new-novel')}
            className="flex items-center space-x-2 rounded-lg border-2 border-purple-200 bg-purple-100 px-4 py-2 font-semibold text-purple-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-purple-200"
          >
            <Plus className="h-5 w-5" />
            <span>Launch Novel</span>
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
          <div className="text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <p className="text-gray-500">Loading novels...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Novels</h2>
          <button
            onClick={() => router.push('./launch-new-novel')}
            className="flex items-center space-x-2 rounded-lg border-2 border-purple-200 bg-purple-100 px-4 py-2 font-semibold text-purple-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-purple-200"
          >
            <Plus className="h-5 w-5" />
            <span>Launch Novel</span>
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Novels</h2>
        <button
          onClick={() => router.push('./launch-new-novel')}
          className="flex items-center space-x-2 rounded-lg border-2 border-purple-200 bg-purple-100 px-4 py-2 font-semibold text-purple-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-purple-200"
        >
          <Plus className="h-5 w-5" />
          <span>Launch Novel</span>
        </button>
      </div>

      {novels.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
          <div className="text-center">
            <p className="text-gray-500">No Novels Created Yet</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="hidden md:block">
            {/* Desktop Table with Horizontal Scroll */}
            <div className="min-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-gray-900">
                      Title
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      Public Feedback
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      Published
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      Market Cap
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      24h Volume
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-gray-900">
                      Holders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {novels.map((novel) => (
                    <tr
                      key={novel.id}
                      onClick={() => handleNovelClick(novel.id)}
                      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{novel.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <BooleanIndicator value={novel.seekPublicFeedback} />
                      </td>
                      <td className="px-4 py-4">
                        <BooleanIndicator value={novel.published} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-sm font-medium whitespace-nowrap text-purple-800">
                          {novel.coinSymbol}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900">
                        {novel.coinData?.marketCap
                          ? `$${formatNumber(novel.coinData.marketCap)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900">
                        {novel.coinData?.volume24h
                          ? `$${formatNumber(novel.coinData.volume24h)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900">
                        {novel.coinData?.uniqueHolders
                          ? formatNumber(novel.coinData.uniqueHolders)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {novels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => handleNovelClick(novel.id)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{novel.title}</h3>
                </div>

                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="text-sm text-gray-600">Public Feedback:</div>
                    <div className="flex justify-start">
                      <div className="flex w-12 justify-center">
                        <BooleanIndicator value={novel.seekPublicFeedback} />
                      </div>
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="text-sm text-gray-600">Published:</div>
                    <div className="flex justify-start">
                      <div className="flex w-12 justify-center">
                        <BooleanIndicator value={novel.published} />
                      </div>
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="text-sm text-gray-600">Coin:</div>
                    <div className="flex justify-start">
                      <span className="inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        {novel.coinSymbol}
                      </span>
                    </div>
                    <div></div>
                  </div>
                </div>

                {novel.coinData && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Market Cap</p>
                      <p className="font-medium text-gray-900">
                        ${formatNumber(novel.coinData.marketCap)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">24h Volume</p>
                      <p className="font-medium text-gray-900">
                        ${formatNumber(novel.coinData.volume24h)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Holders</p>
                      <p className="font-medium text-gray-900">
                        {formatNumber(novel.coinData.uniqueHolders)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNovels;
