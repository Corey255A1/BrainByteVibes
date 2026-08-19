import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  isLoading: boolean;
}

export function WildcardButton({ onClick, isLoading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
    >
      <Sparkles size={20} className={isLoading ? 'animate-spin' : ''} />
      <span>{isLoading ? 'Finding Wildcard Idea...' : 'Surprise Me / Wildcard'}</span>
    </button>
  );
}
