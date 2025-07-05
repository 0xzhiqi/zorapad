'use client';

import { BookOpen, ReceiptText, UserPen } from 'lucide-react';
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
  updatedAt: string;
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

interface CommunityNovelCardProps {
  novel: Novel;
}

export default function CommunityNovelCard({ novel }: CommunityNovelCardProps) {
  const getTotalWords = (chapters: typeof novel.chapters) => {
    return chapters.reduce((total, chapter) => total + (chapter.wordCount || 0), 0);
  };

  const chapterCount = novel.chapters.length;
  const chapterText = chapterCount === 1 ? 'chapter' : 'chapters';

  return (
    <div className="group overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 hover:shadow-2xl hover:shadow-purple-500/20">
      <div className="p-8">
        {/* Novel Title */}
        <div className="">
          <h2 className="mb-1 bg-gradient-to-br from-purple-500 to-purple-700 bg-clip-text text-2xl font-bold text-transparent transition-all duration-300 group-hover:from-purple-400 group-hover:to-purple-600">
            {novel.title}
          </h2>
        </div>

        {/* Author */}
        <div className="mb-3 flex items-center space-x-2">
          <UserPen className="h-5 w-5 text-gray-500" />
          <p className="text-gray-600">
            <span className="font-medium">by</span>{' '}
            {novel.author.name || novel.author.email || 'Anonymous'}
          </p>
        </div>

        {/* Chapters and Words */}
        <div className="mb-4 space-y-1">
          <p className="text-md font-semibold text-gray-800">
            {chapterCount} {chapterText}
          </p>
          <div className="mb-3 flex items-center space-x-2">
            <ReceiptText className="h-5 w-5 text-gray-500" />
            <p className="text-gray-600">{getTotalWords(novel.chapters).toLocaleString()} words</p>
          </div>
        </div>

        {/* Coin Information */}
        <div className="mb-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">{novel.coinName}</h3>
          </div>

          {/* Coin Metrics */}
          {novel.coinData ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <p className="mb-1 text-xs text-gray-500">Market Cap</p>
                <p className="font-bold text-gray-900">${formatNumber(novel.coinData.marketCap)}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <p className="mb-1 text-xs text-gray-500">24h Volume</p>
                <p className="font-bold text-gray-900">${formatNumber(novel.coinData.volume24h)}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <p className="mb-1 text-xs text-gray-500">Holders</p>
                <p className="font-bold text-gray-900">{novel.coinData.uniqueHolders}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white/60 p-4 text-center text-sm text-gray-400">
              {novel.coinAddress ? 'Loading coin data...' : 'No coin data available'}
            </div>
          )}
        </div>

        {/* Read & Feedback Button */}
        <Link
          href={`/community/${novel.id}`}
          className="group relative mb-5 flex w-full items-center justify-center space-x-1 overflow-hidden rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-500 hover:to-purple-700 hover:shadow-xl"
        >
          {/* Shimmer effect */}
          <div className="group-hover:animate-shimmer absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Inner glow */}
          <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-purple-300/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Content */}
          <div className="relative z-10 flex items-center space-x-1">
            <BookOpen className="h-4 w-4 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
            <span className="drop-shadow-sm">Read & Feedback</span>
          </div>

          {/* Ripple effect on click */}
          <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-150 group-active:opacity-100" />
        </Link>

        {/* Last Updated Date */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Last Updated: {new Date(novel.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
