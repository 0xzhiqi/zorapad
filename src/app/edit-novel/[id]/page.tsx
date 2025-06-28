'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Novel {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  seekPublicFeedback: boolean;
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
}

export default function EditNovelPage() {
  const params = useParams();
  const id = params.id as string;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!novel) {
    return <div>Novel not found</div>;
  }

  return (
    <div>
      <h1>Edit Novel: {novel.title}</h1>
      <div>
        <p><strong>Coin Name:</strong> {novel.coinName}</p>
        <p><strong>Coin Symbol:</strong> {novel.coinSymbol}</p>
        <p><strong>Author:</strong> {novel.author.name || 'Unknown'}</p>
        <p><strong>Seeking Public Feedback:</strong> {novel.seekPublicFeedback ? 'Yes' : 'No'}</p>
        {novel.coinAddress && (
          <p><strong>Coin Address:</strong> {novel.coinAddress}</p>
        )}
      </div>
      {/* Your edit form here */}
    </div>
  );
}
