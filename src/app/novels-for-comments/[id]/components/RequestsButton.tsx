import { MessageCircleQuestion } from 'lucide-react';

interface RequestsButtonProps {
  onClick: () => void;
  requestCount: number;
  isVisible: boolean;
}

export default function RequestsButton({ onClick, requestCount, isVisible }: RequestsButtonProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-green-200"
    >
      <MessageCircleQuestion className="h-6 w-6" />
      {requestCount > 0 && (
        <span className="absolute top-4 right-3 text-xs leading-none font-bold text-green-500">
          {requestCount > 99 ? '99+' : requestCount}
        </span>
      )}
    </button>
  );
}