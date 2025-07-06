import { ChevronRight, User } from 'lucide-react';
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
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
      <div
        className="group relative inline-flex cursor-pointer items-center space-x-4 rounded-xl p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
        onClick={handleProfileClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProfileClick();
          }
        }}
      >
        <div className="relative rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
          <User className="h-8 w-8 text-purple-600 transition-all duration-300 group-hover:text-purple-700" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200/0 to-indigo-200/0 transition-all duration-300 group-hover:from-purple-200/20 group-hover:to-indigo-200/20"></div>
        </div>

        <div className="relative flex h-16 min-w-0 flex-1 flex-col justify-center">
          <div className="transition-all duration-300 ease-out group-hover:min-w-36 group-hover:-translate-y-2">
            <h1 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-gray-800">
              {user?.name || 'Anonymous User'}
            </h1>
          </div>
          <div className="absolute top-8 right-0 left-0 translate-y-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <p className="mt-2 min-w-36 text-sm text-gray-500">View and edit profile</p>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-gray-400 opacity-60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-600 group-hover:opacity-100" />

        {/* Subtle shine effect */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      </div>
    </div>
  );
};

export default ProfileHeader;
