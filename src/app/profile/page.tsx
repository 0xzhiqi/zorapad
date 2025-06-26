'use client';

import { useState } from 'react';

import { LogOut, User, Wallet } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import Navbar from '../components/Navbar';

const ProfilePage = async () => {
  const session = await auth();
  console.log('session_in_ProfilePage:', session);

  // Server-side session verification - redirect if no valid session
  if (!session) {
    redirect('/');
  }

  const user = session.user;

  return <ProfilePageClient user={user} />;
};

// Client component to handle mobile menu state
const ProfilePageClient = ({ user }: { user: any }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Profile Header */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.name || 'Anonymous User'}
                  </h1>
                  <p className="text-gray-600">ZoraPad Writer</p>
                </div>
              </div>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center space-x-2 rounded-lg bg-red-100 px-4 py-2 text-red-700 transition-colors hover:bg-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>

          {/* Account Details */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Account Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-900">{user?.name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">User ID</label>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-mono text-sm text-gray-900">{user?.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Wallet Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Connected Wallet
                </label>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-mono text-sm break-all text-gray-900">
                    {user?.walletAddress || 'No wallet connected'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-700">Session Active</span>
                </div>
                <p className="mt-1 text-sm text-green-600">
                  Your wallet is successfully connected and authenticated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
