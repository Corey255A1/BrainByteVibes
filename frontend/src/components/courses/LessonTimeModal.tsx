import { useState } from 'preact/hooks';
import { Clock, X, Zap, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import type { CourseNode } from '../../types';

interface Props {
  node: CourseNode;
  onClose: () => void;
  onStartLesson: (timeMinutes: number) => void;
}

const TIME_OPTIONS = [
  {
    minutes: 3,
    label: '3 Mins',
    tag: 'Quick Blitz',
    icon: Zap,
    description: '~600 words • 1 Core Mental Model • 1 Quiz check'
  },
  {
    minutes: 5,
    label: '5 Mins',
    tag: 'Standard Bite',
    icon: Clock,
    description: '~1,000 words • Balanced Deep-Dive • 1 Interactive Game'
  },
  {
    minutes: 10,
    label: '10 Mins',
    tag: 'Deep Dive',
    icon: BookOpen,
    description: '~2,000 words • In-depth examples • 2 Knowledge Checks'
  },
  {
    minutes: 15,
    label: '15 Mins',
    tag: 'Mastery Session',
    icon: Layers,
    description: '~3,000 words • Comprehensive case study • Multi-quiz challenges'
  }
];

export function LessonTimeModal({ node, onClose, onStartLesson }: Props) {
  const [selectedTime, setSelectedTime] = useState(5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            Lesson Selection
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">{node.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{node.description}</p>
        </div>

        <div className="my-5">
          <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-emerald-400" />
            <span>How much time do you have right now?</span>
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {TIME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedTime === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setSelectedTime(opt.minutes)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{opt.label}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onStartLesson(selectedTime)}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            <span>Start {selectedTime}-Min Lesson</span>
          </button>
        </div>
      </div>
    </div>
  );
}
