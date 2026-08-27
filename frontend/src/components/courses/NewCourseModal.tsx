import { useState } from 'preact/hooks';
import { Sparkles, X, Loader2, BookOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreateCourse: (topicPrompt: string) => Promise<void>;
  isLoading: boolean;
}

const TOPIC_SUGGESTIONS = [
  'Calculus & Derivatives',
  'Quantum Computing Basics',
  'Rust Memory Safety & Lifetimes',
  'Qt Widgets & GUI Architecture',
  'LVGL Embedded Graphics',
  'Music Theory & Counterpoint',
  'Art History: Renaissance to Modern',
  'Circuit Design & Microcontrollers',
  'Python Data Structures',
  'Linear Algebra for Machine Learning'
];

export function NewCourseModal({ onClose, onCreateCourse, isLoading }: Props) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onCreateCourse(prompt.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">I want to learn...</h2>
            <p className="text-xs text-slate-400">Describe any topic you want to master.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <textarea
              value={prompt}
              onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              placeholder="e.g. Calculus, Quantum Mechanics, Rust Lifetimes, LVGL, Music Theory..."
              disabled={isLoading}
              rows={3}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Popular Topic Ideas
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {TOPIC_SUGGESTIONS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setPrompt(topic)}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition-all flex items-center gap-1"
                >
                  <BookOpen size={12} className="opacity-60" />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating DAG...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
