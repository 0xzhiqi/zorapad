import { LogOut } from 'lucide-react';
import { Session } from 'next-auth';

interface AccountDetailsProps {
  user: Session['user'];
  onLogoutClick: (e: React.FormEvent) => void;
}

const AccountDetails = ({ user, onLogoutClick }: AccountDetailsProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Account Details</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-gray-900">{user?.name || 'Not set'}</p>
          </div>
        </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-700">Session Active</span>
            </div>
            <form onSubmit={onLogoutClick}>
              <button
                type="submit"
                className="flex items-center rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <p className="mt-1 text-sm text-green-600">
            Your wallet is successfully connected and authenticated.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;