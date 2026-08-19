import { useState } from 'preact/hooks';
import type { WordSearchGame as WordSearchData } from '../../types';

interface Props {
  data: WordSearchData;
  onComplete: () => void;
}

export function WordSearchGame({ data, onComplete }: Props) {
  const { gridSize, grid, words } = data;
  const size = gridSize || 6;
  const letterGrid = grid || Array.from({ length: size }, () => Array(size).fill('A'));

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleCellSelection = (r: number, c: number) => {
    if (isCompleted) return;

    // Check if cell already selected
    const existingIndex = selectedCells.findIndex(cell => cell.r === r && cell.c === c);
    let newSelection = [...selectedCells];

    if (existingIndex >= 0) {
      newSelection.splice(existingIndex, 1);
    } else {
      newSelection.push({ r, c });
    }

    setSelectedCells(newSelection);

    // Form current selected word
    const selectedString = newSelection.map(cell => letterGrid[cell.r][cell.c]).join('');
    const matchedWordObj = words.find(
      w => w.word.toUpperCase() === selectedString || w.word.toUpperCase() === selectedString.split('').reverse().join('')
    );

    if (matchedWordObj && !foundWords.has(matchedWordObj.word.toUpperCase())) {
      const nextFound = new Set(foundWords).add(matchedWordObj.word.toUpperCase());
      setFoundWords(nextFound);
      setSelectedCells([]);

      if (nextFound.size === words.length) {
        setIsCompleted(true);
        onComplete();
      }
    }
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.r === r && cell.c === c);
  };

  return (
    <div className="game-card p-4 rounded-xl bg-slate-900 border border-slate-800 text-white max-w-lg mx-auto my-6">
      <h4 className="text-lg font-bold text-teal-400 mb-1 text-center">Word Search</h4>
      <p className="text-xs text-slate-400 mb-4 text-center">Find all key terms in the letter grid</p>

      {/* Grid */}
      <div className="flex justify-center mb-6">
        <div
          className="grid gap-1 bg-slate-950 p-3 rounded-xl border border-slate-800"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {letterGrid.map((row, r) =>
            row.map((letter, c) => {
              const selected = isCellSelected(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleCellSelection(r, c)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 text-base font-bold rounded flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-300 scale-105'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Word List */}
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 mb-4">
        <h5 className="text-xs font-bold text-teal-300 mb-2">Words to Find</h5>
        <div className="flex flex-wrap gap-2">
          {words.map((w, idx) => {
            const isFound = foundWords.has(w.word.toUpperCase());
            return (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  isFound
                    ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 line-through'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {w.word} <span className="text-[10px] opacity-70">({w.hint})</span>
              </div>
            );
          })}
        </div>
      </div>

      {isCompleted && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-center text-emerald-300 font-semibold text-sm">
          🎉 Word Search completed! Bonus XP unlocked!
        </div>
      )}
    </div>
  );
}
