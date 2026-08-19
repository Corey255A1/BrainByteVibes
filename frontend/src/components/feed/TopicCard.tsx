import type { TopicCard as ITopicCard } from '../../types';
import { BookOpen, X, Sparkles } from 'lucide-react';

interface Props {
  topic: ITopicCard;
  onRead: (topic: ITopicCard) => void;
  onDismiss: (topicId: string) => void;
}

export function TopicCard({ topic, onRead, onDismiss }: Props) {
  return (
    <div className={`relative w-full p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 shadow-xl flex flex-col justify-between min-h-[220px] ${
      topic.isWildcard
        ? 'bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border-purple-500/50 shadow-purple-950/50'
        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
    }`}>
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            topic.isWildcard
              ? 'bg-purple-900/60 border-purple-400/40 text-purple-300'
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
          }`}>
            {topic.isWildcard ? '✨ Wildcard' : topic.category}
          </span>
          <button
            onClick={() => onDismiss(topic.id)}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-slate-800/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight">
          {topic.title}
        </h3>

        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
          {topic.subtitle}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          ⏱️ 3-5 min read
        </span>

        <button
          onClick={() => onRead(topic)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
            topic.isWildcard
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          {topic.isWildcard ? <Sparkles size={16} /> : <BookOpen size={16} />} Read Now
        </button>
      </div>
    </div>
  );
}
