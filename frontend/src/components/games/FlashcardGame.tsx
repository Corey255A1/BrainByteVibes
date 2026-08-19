import { useState } from 'preact/hooks';
import type { FlashcardGame as FlashcardData } from '../../types';

interface Props {
  data: FlashcardData;
  onComplete: () => void;
}

export function FlashcardGame({ data, onComplete }: Props) {
  const cards = data.cards || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (cards.length === 0) {
    return <div className="text-slate-400 p-4 text-center">No flashcards generated.</div>;
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
      onComplete();
    }
  };

  return (
    <div className="game-card p-4 rounded-xl bg-slate-900 border border-slate-800 text-white max-w-md mx-auto my-6 text-center">
      <h4 className="text-lg font-bold text-amber-400 mb-1">Interactive Flashcards</h4>
      <p className="text-xs text-slate-400 mb-4">Card {currentIndex + 1} of {cards.length}</p>

      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[160px] p-6 rounded-xl border border-slate-700 bg-slate-800/80 hover:border-amber-500/50 cursor-pointer flex flex-col items-center justify-center transition-all duration-300 transform active:scale-98 shadow-lg"
      >
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
          {flipped ? 'Answer (Click to flip)' : 'Question (Click to reveal answer)'}
        </span>
        <p className="text-base font-medium text-slate-100">
          {flipped ? currentCard.back : currentCard.front}
        </p>
      </div>

      {!completed ? (
        <button
          onClick={handleNext}
          className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors shadow-md"
        >
          {currentIndex + 1 === cards.length ? 'Finish Drill ✨' : 'Next Card →'}
        </button>
      ) : (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-emerald-300 font-semibold text-sm">
          🎉 All cards completed! Bonus XP unlocked!
        </div>
      )}
    </div>
  );
}
