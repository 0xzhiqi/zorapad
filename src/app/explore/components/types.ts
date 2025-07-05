export interface Author {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

export interface Chapter {
  id: string;
  title: string;
  wordCount: number;
}

export interface CoinData {
  marketCap: string;
  volume24h: string;
  uniqueHolders: number;
}

export interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  coinAddress: string | null;
  novelAddress: string | null;
  author: Author;
  chapters: Chapter[];
  coinData: CoinData | null;
  createdAt: string;
}

export const formatNumber = (num: string | number) => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(2);
};