import { useState, useRef } from 'preact/hooks';
import type { TopicCard as ITopicCard } from '../../types';
import { X, Glasses, Bookmark, Sparkles, RefreshCw } from 'lucide-react';


interface Props {
  topics: ITopicCard[];
  onRead: (topic: ITopicCard) => void;
  onPass: (topicId: string) => void;
  onSaveForLater: (topicId: string) => void;
  onNeedsReplenish: () => void;
  isReplenishing: boolean;
}

export function SwipeTopicDeck({
  topics,
  onRead,
  onPass,
  onSaveForLater,
  onNeedsReplenish,
  isReplenishing
}: Props) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  if (topics.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
          <Sparkles size={28} className={isReplenishing ? 'animate-spin' : ''} />
        </div>
        <h4 className="text-lg font-bold text-slate-100">
          {isReplenishing ? 'Curating Fresh Topics...' : 'Topic Queue Cleared'}
        </h4>
        <p className="text-xs text-slate-400 max-w-xs">
          {isReplenishing
            ? 'Generating new micro-learning cards based on your preferences...'
            : 'You have gone through all active cards! Tap below to replenish.'}
        </p>
        <button
          onClick={onNeedsReplenish}
          disabled={isReplenishing}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs"
        >
          <RefreshCw size={16} className={isReplenishing ? 'animate-spin' : ''} /> Generate Topics
        </button>
      </div>
    );
  }

  const topCard = topics[0];
  const nextCard = topics[1];

  // Drag Gesture Handlers
  const handlePointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    const thresholdX = 110;
    const thresholdY = 120;

    if (dragOffset.x > thresholdX) {
      // Swipe Right -> Read Now
      triggerRead();
    } else if (dragOffset.x < -thresholdX) {
      // Swipe Left -> Pass / Not interested
      triggerPass();
    } else if (dragOffset.y > thresholdY) {
      // Swipe Down -> Save for Later
      triggerSave();
    } else {
      // Reset position
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const triggerPass = () => {
    onPass(topCard.id);
    checkReplenishThreshold();
    setDragOffset({ x: 0, y: 0 });
  };

  const triggerRead = () => {
    onRead(topCard);
    checkReplenishThreshold();
    setDragOffset({ x: 0, y: 0 });
  };

  const triggerSave = () => {
    onSaveForLater(topCard.id);
    checkReplenishThreshold();
    setDragOffset({ x: 0, y: 0 });
  };

  const checkReplenishThreshold = () => {
    if (topics.length - 1 <= 2) {
      onNeedsReplenish();
    }
  };

  // Rotation & Opacity calculations
  const rotation = dragOffset.x * 0.08; // degrees
  const swipeDirection =
    dragOffset.x > 40
      ? 'RIGHT'
      : dragOffset.x < -40
      ? 'LEFT'
      : dragOffset.y > 40
      ? 'DOWN'
      : null;

  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[380px] flex flex-col justify-between items-center select-none touch-none">
      {/* Cards Stack Container */}
      <div className="relative w-full h-[320px] flex items-center justify-center">
        {/* Next Card Background Preview */}
        {nextCard && (
          <div className="absolute w-full h-full p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 scale-95 translate-y-3 opacity-60 pointer-events-none transition-all flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {nextCard.category}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-300 mb-1 line-clamp-2">{nextCard.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{nextCard.subtitle}</p>
            </div>
            <div className="text-[10px] text-slate-500">⏱️ Up next...</div>
          </div>
        )}

        {/* Top Active Card */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          className={`absolute w-full h-full p-6 rounded-3xl border shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing backdrop-blur-md transition-shadow ${
            topCard.isWildcard
              ? 'bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 border-purple-500/60 shadow-purple-950/60'
              : 'bg-slate-900 border-slate-700/80 shadow-slate-950/80'
          }`}
        >
          {/* Swipe Indicator Badges */}
          {swipeDirection === 'RIGHT' && (
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-lg transform rotate-12 shadow-lg border border-emerald-300">
              Read Now 📖
            </div>
          )}
          {swipeDirection === 'LEFT' && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-lg transform -rotate-12 shadow-lg border border-rose-300">
              Pass ✖️
            </div>
          )}
          {swipeDirection === 'DOWN' && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-lg shadow-lg border border-amber-300">
              Save For Later 📌
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                topCard.isWildcard
                  ? 'bg-purple-900/60 border-purple-400/40 text-purple-300'
                  : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
              }`}>
                {topCard.isWildcard ? '✨ Wildcard' : topCard.category}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Swipe ← Pass | Read →
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2 leading-tight">
              {topCard.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
              {topCard.subtitle}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">⏱️ 3-5 min read</span>
            <span className="text-[10px] text-slate-500">Swipe down to save 📌</span>
          </div>
        </div>
      </div>

      {/* Background Generation Indicator */}
      {isReplenishing && (
        <div className="my-2 flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-pulse bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30">
          <Sparkles size={14} className="animate-spin" />
          <span>Curating new topics in background...</span>
        </div>
      )}

      {/* Gesture Controls Bar */}
      <div className="w-full flex justify-around items-center pt-4">
        {/* Pass Button */}
        <button
          onClick={triggerPass}
          title="Pass / Not interested (Swipe Left)"
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-rose-400 hover:border-rose-500 hover:bg-rose-950/40 flex items-center justify-center transition-all shadow-lg active:scale-90"
        >
          <X size={22} />
        </button>

        {/* Save For Later Button */}
        <button
          onClick={triggerSave}
          title="Save for Later (Swipe Down)"
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-amber-400 hover:border-amber-500 hover:bg-amber-950/40 flex items-center justify-center transition-all shadow-lg active:scale-90"
        >
          <Bookmark size={20} />
        </button>

        {/* Read Now Button */}
        <button
          onClick={triggerRead}
          title="Read Now (Swipe Right)"
          className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 flex items-center justify-center transition-all shadow-xl shadow-emerald-500/20 active:scale-90"
        >
          <Glasses size={26} />
        </button>
      </div>
    </div>
  );
}
