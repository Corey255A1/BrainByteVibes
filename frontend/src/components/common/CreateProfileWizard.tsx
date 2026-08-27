import { useState } from 'preact/hooks';
import type { Profile, TopicCard as ITopicCard } from '../../types';
import { db } from '../../db/database';
import { geminiService } from '../../services/gemini';
import { syncManager } from '../../services/sync';
import { Sparkles, CheckCircle2, Plus, Clock, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';


interface Props {
  onComplete: (profile: Profile) => void;
  onCancel?: () => void;
}

export function CreateProfileWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🧑‍💻');
  const [readLengthMinutes, setReadLengthMinutes] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Software Architecture', 'C++', 'Math Puzzles', 'Science'
  ]);
  const [customTag, setCustomTag] = useState('');
  const [isGeneratingFirstDeck, setIsGeneratingFirstDeck] = useState(false);

  const availableEmojis = ['🧑‍💻', '👩‍🔬', '🚀', '🧠', '🎨', '📚', '⚡', '🔮', '💡', '🪐'];
  const topicPresets = [
    { title: 'Software Architecture', icon: '💻' },
    { title: 'Artificial Intelligence', icon: '🤖' },
    { title: 'Science & Physics', icon: '🔬' },
    { title: 'Math Puzzles', icon: '🧩' },
    { title: 'C++ & Systems', icon: '⚡' },
    { title: 'Music Theory & Audio', icon: '🎵' },
    { title: 'History & Myths', icon: '🏛️' },
    { title: 'Space Exploration', icon: '🌌' },
    { title: 'Cyber Security', icon: '🛡️' },
    { title: 'Philosophy & Thought', icon: '🤔' },
    { title: 'Biology & Nature', icon: '🌿' }
  ];

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;
    const trimmed = customTag.trim();
    if (!selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed]);
    }
    setCustomTag('');
  };

  const handleCreateAndGenerate = async () => {
    setIsGeneratingFirstDeck(true);
    const trimmedName = name.trim() || 'Learner';
    const finalCategories = selectedCategories.length > 0 ? selectedCategories : ['General Knowledge'];

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      avatarEmoji: selectedEmoji,
      categories: finalCategories,
      readLengthMinutes,
      feedLayoutMode: 'swipe',
      createdAt: new Date()
    };

    try {
      // 1. Add profile to local DB
      await db.profiles.add(newProfile);
      localStorage.setItem('brainbyte_active_user_id', newProfile.id);

      // 2. Push user profile settings to backend NAS server
      await syncManager.pushUserProfile(newProfile);

      // 3. Pre-generate initial 5 topic cards for this new user profile
      const rawTopics = await geminiService.fetchTopics(
        finalCategories,
        [],
        'gemini-1.5-flash-8b'
      );

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const newCards: ITopicCard[] = rawTopics.map((item, idx) => ({
        id: `topic-${Date.now()}-${idx}`,
        profileId: newProfile.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category || finalCategories[0],
        isWildcard: false,
        generatedAt: now,
        expiresAt,
        status: 'pending'
      }));

      await db.topicCards.bulkAdd(newCards);
    } catch (e) {
      console.warn('Failed to pre-generate initial topic deck during setup:', e);
    } finally {
      setIsGeneratingFirstDeck(false);
      onComplete(newProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Step Progress Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
              Step {step} of 2
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-300">
              {step === 1 ? 'Profile Identity' : 'Initial Topic Deck'}
            </span>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Step 1: Profile Name, Avatar & Duration */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="text-center flex flex-col items-center gap-1.5">
              <span className="text-4xl p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                {selectedEmoji}
              </span>
              <h2 className="text-xl font-bold text-white">Create Your Learner Profile</h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Personalize your name, avatar, and daily micro-learning duration.
              </p>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name (e.g. Corey)..."
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Emoji Avatar Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Choose Avatar Emoji
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {availableEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`p-2.5 text-xl rounded-xl transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-emerald-500 text-slate-950 scale-110 shadow-lg font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Duration Goal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-emerald-400" />
                Target Reading Duration per Article
              </label>
              <div className="flex gap-2">
                {[2, 5, 10].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setReadLengthMinutes(mins)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      readLengthMinutes === mins
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Next: Select Initial Topics</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Topic Selection Screen */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Select Initial Topics</h3>
                <p className="text-xs text-slate-400">
                  Pick topics you want to swipe & learn about daily.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold">
                {selectedCategories.length} Selected
              </span>
            </div>

            {/* Topic Cards Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {topicPresets.map(preset => {
                const isSelected = selectedCategories.includes(preset.title);
                return (
                  <button
                    key={preset.title}
                    onClick={() => toggleCategory(preset.title)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{preset.icon}</span>
                      <span className="text-xs font-bold leading-tight">{preset.title}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Topic Input */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Add custom topic (e.g., Docker, Quantum Computing)..."
                value={customTag}
                onInput={(e) => setCustomTag((e.target as HTMLInputElement).value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleAddCustomTag}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 rounded-xl text-xs transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep(1)}
                disabled={isGeneratingFirstDeck}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                onClick={handleCreateAndGenerate}
                disabled={isGeneratingFirstDeck || selectedCategories.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 font-extrabold text-slate-950 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isGeneratingFirstDeck ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-slate-950" />
                    <span>Curating First Topic Deck...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Save & Generate First Deck 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
