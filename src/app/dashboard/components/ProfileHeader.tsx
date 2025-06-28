import { User } from 'lucide-react';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  user: Session['user'];
}

const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <div 
      className="mb-6 rounded-lg bg-white p-6 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
      onClick={handleProfileClick}
    >
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