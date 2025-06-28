import { User } from 'lucide-react';
import { Session } from 'next-auth';

interface ProfileHeaderProps {
  user: Session['user'];
}

const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
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
    </div>
  );
};

export default ProfileHeader;