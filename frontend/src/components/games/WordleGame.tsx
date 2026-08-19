import { useState } from 'preact/hooks';
import type { WordleGame as WordleGameData } from '../../types';

interface Props {
  data: WordleGameData;
  onComplete: () => void;
}

export function WordleGame({ data, onComplete }: Props) {
  const target = (data.targetWord || 'LEARN').toUpperCase();
  const wordLength = target.length;
  const maxAttempts = data.maxAttempts || 6;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const handleKeyPress = (char: string) => {
    if (isCompleted || isFailed) return;

    if (char === 'ENTER') {
      if (currentGuess.length !== wordLength) return;

      const newGuesses = [...guesses, currentGuess.toUpperCase()];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess.toUpperCase() === target) {
        setIsCompleted(true);
        onComplete();
      } else if (newGuesses.length >= maxAttempts) {
        setIsFailed(true);
      }
    } else if (char === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[A-Z]$/i.test(char)) {
      setCurrentGuess(prev => prev + char.toUpperCase());
    }
  };

  const getLetterStatus = (guess: string, index: number) => {
    const letter = guess[index];
    if (!letter) return '';
    if (target[index] === letter) return 'bg-emerald-600 text-white border-emerald-600';
    if (target.includes(letter)) return 'bg-amber-500 text-white border-amber-500';
    return 'bg-slate-700 text-slate-300 border-slate-700';
  };

  const rows = Array.from({ length: maxAttempts });

  return (
    <div className="game-card p-4 rounded-xl bg-slate-900 border border-slate-800 text-white max-w-md mx-auto my-6">
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold text-emerald-400">Wordle Keyword Drill</h4>
        <p className="text-xs text-slate-400 mt-1">Hint: {data.hint}</p>
      </div>

      <div className="grid gap-2 justify-center mb-6">
        {rows.map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');

          return (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {Array.from({ length: wordLength }).map((_, colIndex) => {
                const char = guess[colIndex] || '';
                const statusClass = guesses[rowIndex]
                  ? getLetterStatus(guesses[rowIndex], colIndex)
                  : char
                  ? 'border-slate-500 text-white'
                  : 'border-slate-800 text-slate-500';

                return (
                  <div
                    key={colIndex}
                    className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-lg font-bold uppercase transition-all ${statusClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {isCompleted && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-center mb-4 text-emerald-300 font-semibold text-sm">
          🎉 Correct! You unlocked bonus XP!
        </div>
      )}

      {isFailed && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/30 rounded-lg text-center mb-4 text-rose-300 font-semibold text-sm">
          The word was: <span className="font-bold text-white">{target}</span>
        </div>
      )}

      {!isCompleted && !isFailed && (
        <div className="flex flex-col gap-1.5 items-center text-xs">
          <div className="flex gap-1 justify-center flex-wrap">
            {['Q','W','E','R','T','Y','U','I','O','P'].map(k => (
              <button key={k} onClick={() => handleKeyPress(k)} className="px-2 py-2 bg-slate-800 rounded font-semibold text-slate-200 hover:bg-slate-700 active:scale-95">
                {k}
              </button>
            ))}
          </div>
          <div className="flex gap-1 justify-center flex-wrap">
            {['A','S','D','F','G','H','J','K','L'].map(k => (
              <button key={k} onClick={() => handleKeyPress(k)} className="px-2 py-2 bg-slate-800 rounded font-semibold text-slate-200 hover:bg-slate-700 active:scale-95">
                {k}
              </button>
            ))}
          </div>
          <div className="flex gap-1 justify-center flex-wrap">
            <button onClick={() => handleKeyPress('ENTER')} className="px-3 py-2 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-600 active:scale-95">
              ENTER
            </button>
            {['Z','X','C','V','B','N','M'].map(k => (
              <button key={k} onClick={() => handleKeyPress(k)} className="px-2 py-2 bg-slate-800 rounded font-semibold text-slate-200 hover:bg-slate-700 active:scale-95">
                {k}
              </button>
            ))}
            <button onClick={() => handleKeyPress('BACKSPACE')} className="px-3 py-2 bg-rose-900 text-rose-200 rounded font-bold hover:bg-rose-800 active:scale-95">
              ⌫
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
