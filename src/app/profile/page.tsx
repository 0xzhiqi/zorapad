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

      // Then sign out from auth with redirect
      await signOut({
        redirect: true,
        callbackUrl: '/',
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      // Fallback: force redirect to home
      window.location.href = '/';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-600">
                <LogOut className="h-5 w-5" />
                Confirm Logout
              </h3>
              <button
                onClick={handleCancelLogout}
                className="text-gray-400 transition-colors hover:text-gray-600"
                disabled={isLoggingOut}
              ></button>
            </div>

            <p className="mb-8 text-base text-gray-700">Are you sure you want to sign out?</p>

            {isLoggingOut ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-700">Signing out...</span>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700"
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
