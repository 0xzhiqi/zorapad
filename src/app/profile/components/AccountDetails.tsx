'use client';

import { useState, useTransition } from 'react';

// Import section - add ScreenShare to the imports
import { CheckCircle, Edit3, LogOut, ScreenShare, User, Wallet, X } from 'lucide-react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import { updateUserName } from '../actions/user';

interface AccountDetailsProps {
  user: Session['user'];
  onLogoutClick: (e: React.FormEvent) => void;
}

const AccountDetails = ({ user, onLogoutClick }: AccountDetailsProps) => {
  const { data: session, update } = useSession();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  console.log('userid', user.id);

  const handleUpdateName = () => {
    if (!user?.id) return;

    setError('');
    setSuccess(false);

    startTransition(async () => {
      // Optimistic update - immediately show the new name
      setDisplayName(newName.trim());

      const result = await updateUserName(user.id, newName);

      if (result.success) {
        // Update session to get fresh data from database
        await update();

        setSuccess(true);
        setTimeout(() => {
          setShowNameModal(false);
          setSuccess(false);
          // Remove window.location.reload() - no page refresh needed!
        }, 1000);
      } else {
        // Revert optimistic update on error
        setDisplayName(session?.user?.name || user?.name || '');
        setError(result.error || 'Failed to update name');
      }
    });
  };

  const handleCloseModal = () => {
    setShowNameModal(false);
    setNewName(displayName || '');
    setError('');
    setSuccess(false);
  };

  // Use displayName for immediate UI update, fallback to session data
  const currentDisplayName = displayName || session?.user?.name || user?.name || 'Not set';

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            Account Details
          </h2>
        </div>

        <div className="space-y-6">
          {/* Display Name Section */}
          <div className="group">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              <User className="h-4 w-4" />
              Display Name
            </label>
            <div className="relative">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 transition-all duration-200 group-hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-gray-500">{currentDisplayName}</p>
                  <button
                    onClick={() => setShowNameModal(true)}
                    className="flex min-w-32 items-center gap-2 rounded-lg bg-purple-100 px-6 py-2 text-sm font-medium text-purple-700 transition-colors duration-200 hover:bg-purple-200"
                  >
                    <Edit3 className="h-4 w-4" />
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Wallet Section */}
          <div className="group">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              <Wallet className="h-4 w-4" />
              Wallet Address
            </label>
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 transition-all duration-200 group-hover:shadow-md">
              <p className="text-base font-medium text-gray-500">
                {' '}
                {user?.walletAddress || 'No wallet connected'}
              </p>
            </div>
          </div>

          {/* Session Status Section */}
          <div className="group">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              <ScreenShare className="h-4 w-4" />
              Session
            </label>
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 transition-all duration-200 group-hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-base font-medium text-green-500">Active</span>
                  </div>
                </div>
                <form onSubmit={onLogoutClick}>
                  <button
                    type="submit"
                    className="flex min-w-24 items-center gap-2 rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Name Update Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Edit3 className="h-4 w-4 text-purple-600" />
                Update Display Name
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 transition-colors hover:text-gray-600"
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  placeholder="Enter your display name"
                  maxLength={50}
                  disabled={isPending}
                />
                <p className="mt-1 text-xs text-gray-500">{newName.length}/50 characters</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Name updated successfully!
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex space-x-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                disabled={isPending || !newName.trim() || newName === user?.name}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  'Update Name'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountDetails;
