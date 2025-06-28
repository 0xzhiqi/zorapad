import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MyNovels = () => {
  const router = useRouter();

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Novels</h2>
        <button
          onClick={() => router.push('./launch-new-novel')}
          className="flex items-center space-x-2 rounded-lg border-2 border-purple-200 bg-purple-100 px-4 py-2 font-semibold text-purple-600 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-purple-200"
        >
          <Plus className="h-5 w-5" />
          <span>Launch Novel</span>
        </button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
        <div className="text-center">
          <p className="text-gray-500">No Novels Created Yet</p>
        </div>
      </div>
    </div>
  );
};

export default MyNovels;