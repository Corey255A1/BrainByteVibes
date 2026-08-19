import { useState, useEffect } from 'preact/hooks';
import { db } from '../../db/database';
import type { Profile } from '../../types';
import { Plus, Check } from 'lucide-react';

interface Props {
  currentProfile: Profile;
  onSelectProfile: (profile: Profile) => void;
}

export function ProfileSwitcher({ currentProfile, onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🧑‍💻');

  const emojis = ['🧑‍💻', '👩‍🔬', '🚀', '🧠', '🎨', '📚', '⚡'];

  useEffect(() => {
    db.profiles.toArray().then(setProfiles);
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      avatarEmoji: newEmoji,
      categories: ['Software Architecture', 'Science', 'Math Puzzles'],
      readLengthMinutes: 5,
      createdAt: new Date()
    };
    await db.profiles.add(newProfile);
    onSelectProfile(newProfile);
    setNewName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-200 transition-all"
      >
        <span className="text-base">{currentProfile.avatarEmoji}</span>
        <span>{currentProfile.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Switch Profile</div>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectProfile(p);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  p.id === currentProfile.id
                    ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatarEmoji}</span>
                  <span>{p.name}</span>
                </div>
                {p.id === currentProfile.id && <Check size={16} className="text-emerald-400" />}
              </button>
            ))}
          </div>

          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-all"
            >
              <Plus size={14} /> Add Profile
            </button>
          ) : (
            <div className="mt-3 p-2 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <input
                type="text"
                placeholder="User name"
                value={newName}
                onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white text-xs mb-2 focus:outline-none focus:border-emerald-400"
              />
              <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                {emojis.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`p-1 text-base rounded ${newEmoji === e ? 'bg-emerald-700' : 'bg-slate-700'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-1.5 bg-emerald-600 font-bold text-slate-950 rounded hover:bg-emerald-500"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="py-1.5 px-3 bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
