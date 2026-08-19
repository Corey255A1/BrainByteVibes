import { useState, useEffect } from 'preact/hooks';
import type { ConceptMatchGame as ConceptMatchData } from '../../types';

interface Props {
  data: ConceptMatchData;
  onComplete: () => void;
}

export function ConceptMatchGame({ data, onComplete }: Props) {
  const pairs = data.pairs || [];
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [shuffledDefs, setShuffledDefs] = useState<{ id: string; text: string }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const defs = pairs.map(p => ({ id: p.term, text: p.definition }));
    setShuffledDefs([...defs].sort(() => Math.random() - 0.5));
  }, [data]);

  const handleSelectTerm = (term: string) => {
    if (matched.has(term)) return;
    setSelectedTerm(term);
    checkMatch(term, selectedDef);
  };

  const handleSelectDef = (termId: string) => {
    if (matched.has(termId)) return;
    setSelectedDef(termId);
    checkMatch(selectedTerm, termId);
  };

  const checkMatch = (term: string | null, defId: string | null) => {
    if (term && defId) {
      if (term === defId) {
        const nextMatched = new Set(matched).add(term);
        setMatched(nextMatched);
        setSelectedTerm(null);
        setSelectedDef(null);
        if (nextMatched.size === pairs.length) {
          setIsCompleted(true);
          onComplete();
        }
      } else {
        setTimeout(() => {
          setSelectedTerm(null);
          setSelectedDef(null);
        }, 600);
      }
    }
  };

  return (
    <div className="game-card p-4 rounded-xl bg-slate-900 border border-slate-800 text-white max-w-lg mx-auto my-6">
      <h4 className="text-lg font-bold text-sky-400 mb-1 text-center">Concept Match</h4>
      <p className="text-xs text-slate-400 mb-4 text-center">Match each concept term with its definition</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Terms Column */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-1">Concepts</span>
          {pairs.map(p => {
            const isMatched = matched.has(p.term);
            const isSelected = selectedTerm === p.term;
            return (
              <button
                key={p.term}
                onClick={() => handleSelectTerm(p.term)}
                disabled={isMatched}
                className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                  isMatched
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 opacity-60 cursor-default'
                    : isSelected
                    ? 'bg-sky-900/80 border-sky-400 text-white ring-2 ring-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                {p.term}
              </button>
            );
          })}
        </div>

        {/* Definitions Column */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-1">Definitions</span>
          {shuffledDefs.map(d => {
            const isMatched = matched.has(d.id);
            const isSelected = selectedDef === d.id;
            return (
              <button
                key={d.id}
                onClick={() => handleSelectDef(d.id)}
                disabled={isMatched}
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  isMatched
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 opacity-60 cursor-default'
                    : isSelected
                    ? 'bg-sky-900/80 border-sky-400 text-white ring-2 ring-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                {d.text}
              </button>
            );
          })}
        </div>
      </div>

      {isCompleted && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-center text-emerald-300 font-semibold text-sm">
          🎉 All concepts matched! Bonus XP unlocked!
        </div>
      )}
    </div>
  );
}
