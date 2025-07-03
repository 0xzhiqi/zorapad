import { MessageCircle } from 'lucide-react';

interface CommentsButtonProps {
  onClick: () => void;
  commentCount: number;
  isVisible: boolean;
}

export default function CommentsButton({ onClick, commentCount, isVisible }: CommentsButtonProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-500 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-purple-200"
    >
      <MessageCircle className="h-6 w-6" />
      {commentCount > 0 && (
        <span className="absolute top-4 right-3 text-xs leading-none font-bold text-purple-500">
          {commentCount > 99 ? '99+' : commentCount}
        </span>
      )}
    </button>
  );
}