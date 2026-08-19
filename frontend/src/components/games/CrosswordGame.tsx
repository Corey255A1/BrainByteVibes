import { useState } from 'preact/hooks';
import type { CrosswordGame as CrosswordData } from '../../types';

interface Props {
  data: CrosswordData;
  onComplete: () => void;
}

export function CrosswordGame({ data, onComplete }: Props) {
  const { gridSize, clues } = data;
  const rows = gridSize?.rows || 5;
  const cols = gridSize?.cols || 5;

  // Build grid state: cell inputs
  const [userGrid, setUserGrid] = useState<string[][]>(
    Array.from({ length: rows }, () => Array(cols).fill(''))
  );
  const [selectedClueIndex, setSelectedClueIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Helper to check if a cell is part of any clue
  const isCellInUse = (r: number, c: number) => {
    return clues.some(clue => {
      const len = clue.answer.length;
      if (clue.direction === 'across') {
        return r === clue.startRow && c >= clue.startCol && c < clue.startCol + len;
      } else {
        return c === clue.startCol && r >= clue.startRow && r < clue.startRow + len;
      }
    });
  };

  // Get clue number if cell is start of a clue
  const getCellNumber = (r: number, c: number) => {
    const clue = clues.find(cl => cl.startRow === r && cl.startCol === c);
    return clue ? clue.number : null;
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (isCompleted) return;
    const char = val.slice(-1).toUpperCase();
    const nextGrid = userGrid.map(row => [...row]);
    nextGrid[r][c] = char;
    setUserGrid(nextGrid);

    // Check completion
    let allCorrect = true;
    for (const clue of clues) {
      for (let i = 0; i < clue.answer.length; i++) {
        const cr = clue.direction === 'across' ? clue.startRow : clue.startRow + i;
        const cc = clue.direction === 'across' ? clue.startCol + i : clue.startCol;
        if ((nextGrid[cr]?.[cc] || '') !== clue.answer[i].toUpperCase()) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect) {
      setIsCompleted(true);
      onComplete();
    }
  };

  return (
    <div className="game-card p-4 rounded-xl bg-slate-900 border border-slate-800 text-white max-w-lg mx-auto my-6">
      <h4 className="text-lg font-bold text-purple-400 mb-1 text-center">Mini Crossword</h4>
      <p className="text-xs text-slate-400 mb-4 text-center">Fill in the grid to solve the clues</p>

      {/* Grid */}
      <div className="flex justify-center mb-6">
        <div
          className="grid gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const active = isCellInUse(r, c);
              const num = getCellNumber(r, c);

              if (!active) {
                return <div key={`${r}-${c}`} className="w-10 h-10 bg-slate-900 rounded" />;
              }

              return (
                <div key={`${r}-${c}`} className="relative w-10 h-10">
                  {num && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-purple-400 z-10 pointer-events-none">
                      {num}
                    </span>
                  )}
                  <input
                    type="text"
                    maxLength={1}
                    value={userGrid[r][c]}
                    onInput={(e) => handleCellChange(r, c, (e.target as HTMLInputElement).value)}
                    className="w-full h-full text-center text-base font-bold bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-400 uppercase"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clues */}
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 mb-4 text-xs">
        <h5 className="font-bold text-purple-300 mb-2">Clues</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {clues.map((clue, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedClueIndex(idx)}
              className={`p-2 rounded cursor-pointer ${
                selectedClueIndex === idx ? 'bg-purple-900/60 text-purple-200 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="font-bold text-purple-400">{clue.number}. ({clue.direction})</span> {clue.clue}
            </div>
          ))}
        </div>
      </div>

      {isCompleted && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-center text-emerald-300 font-semibold text-sm">
          🎉 Crossword solved! Bonus XP unlocked!
        </div>
      )}
    </div>
  );
}
