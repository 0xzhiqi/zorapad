'use client';

import { useSession } from 'next-auth/react';

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-2">User Profile</h2>
      <p className="text-gray-300">Name: {session.user?.name}</p>
      <p className="text-gray-300">Wallet: {session.user?.walletAddress}</p>
      <p className="text-gray-300">Email: {session.user?.email || 'Not set'}</p>
    </div>
  );
}