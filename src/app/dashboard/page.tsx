'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ProfileHeader from '../components/ProfileHeader';
import MyNovels from '../components/MyNovels';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Add top padding to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-4xl">
          <ProfileHeader user={user} />
          <MyNovels />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
