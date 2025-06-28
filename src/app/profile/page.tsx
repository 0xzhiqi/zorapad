'use client';

import { useEffect, useState } from 'react';

import { LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useActiveWallet } from 'thirdweb/react';

import AccountDetails from './components/AccountDetails';

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleLogoutClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);

    try {
      // First disconnect wallet if connected
      if (activeWallet) {
        await activeWallet.disconnect();
      }

      // Then sign out from auth
      await signOut({ redirect: false });

      // Finally redirect to homepage
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const user = session.user;
  console.log('session_in_profile', session);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Add top padding to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-4xl">
          <AccountDetails user={user} onLogoutClick={handleLogoutClick} />
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
              <button
                onClick={handleCancelLogout}
                className="text-white/60 transition-colors hover:text-white/80"
                disabled={isLoggingOut}
              ></button>
            </div>

            <p className="mb-8 text-lg text-white/70">Are you sure you want to sign out?</p>

            {isLoggingOut ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-violet-400"></div>
                <span className="ml-3 text-white/80">Signing out...</span>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex flex-1 items-center justify-center space-x-2 rounded-full bg-red-100 px-4 py-2 text-red-700 transition-colors hover:bg-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
