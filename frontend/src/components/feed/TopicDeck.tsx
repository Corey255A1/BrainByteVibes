import type { TopicCard as ITopicCard } from '../../types';
import { TopicCard } from './TopicCard';
import { RefreshCw } from 'lucide-react';

interface Props {
  topics: ITopicCard[];
  onRead: (topic: ITopicCard) => void;
  onDismiss: (topicId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function TopicDeck({ topics, onRead, onDismiss, onRefresh, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <RefreshCw size={32} className="animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Curating fresh micro-learning topics...</span>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <h4 className="text-lg font-bold text-slate-200 mb-2">No Active Topic Cards</h4>
        <p className="text-sm text-slate-400 mb-6">You've cleared your feed queue! Click below to generate 5 new topics.</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <RefreshCw size={18} /> Refresh Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Your 5-Topic Deck ({topics.length})
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1">
        {topics.map(t => (
          <TopicCard key={t.id} topic={t} onRead={onRead} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}
