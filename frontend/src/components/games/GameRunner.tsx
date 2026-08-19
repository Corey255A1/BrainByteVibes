import type { GamePayload, WordleGame as IWordle, FlashcardGame as IFlashcard, ConceptMatchGame as IConcept, CrosswordGame as ICrossword, WordSearchGame as ISearch } from '../../types';
import { WordleGame } from './WordleGame';
import { FlashcardGame } from './FlashcardGame';
import { ConceptMatchGame } from './ConceptMatchGame';
import { CrosswordGame } from './CrosswordGame';
import { WordSearchGame } from './WordSearchGame';

interface Props {
  payload: GamePayload | null;
  onComplete: () => void;
}

export function GameRunner({ payload, onComplete }: Props) {
  if (!payload || !payload.type || !payload.data) {
    return null;
  }

  switch (payload.type) {
    case 'wordle':
      return <WordleGame data={payload.data as IWordle} onComplete={onComplete} />;
    case 'flashcard':
      return <FlashcardGame data={payload.data as IFlashcard} onComplete={onComplete} />;
    case 'concept_match':
      return <ConceptMatchGame data={payload.data as IConcept} onComplete={onComplete} />;
    case 'crossword':
      return <CrosswordGame data={payload.data as ICrossword} onComplete={onComplete} />;
    case 'word_search':
      return <WordSearchGame data={payload.data as ISearch} onComplete={onComplete} />;
    default:
      return <div className="text-slate-400 text-xs p-4 text-center">Unknown game type: {payload.type}</div>;
  }
}
