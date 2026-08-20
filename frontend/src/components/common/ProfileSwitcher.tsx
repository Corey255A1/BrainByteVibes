import { useState, useEffect } from 'preact/hooks';
import { db } from '../../db/database';
import type { Profile } from '../../types';
import { CreateProfileWizard } from './CreateProfileWizard';
import { Plus, Check } from 'lucide-react';

interface Props {
  currentProfile: Profile;
  onSelectProfile: (profile: Profile) => void;
}

export function ProfileSwitcher({ currentProfile, onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    db.profiles.toArray().then(setProfiles);
  }, [isOpen]);

  const handleWizardComplete = (newProfile: Profile) => {
    setShowWizard(false);
    setIsOpen(false);
    onSelectProfile(newProfile);
  };

  return (
    <div className="relative">
      {showWizard && (
        <CreateProfileWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-200 transition-all"
      >
        <span className="text-base">{currentProfile.avatarEmoji}</span>
        <span>{currentProfile.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Switch Profile</div>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  localStorage.setItem('brainbyte_active_user_id', p.id);
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

          <button
            onClick={() => {
              setIsOpen(false);
              setShowWizard(true);
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-all"
          >
            <Plus size={14} /> Add Profile Wizard
          </button>
        </div>
      )}
    </div>
  );
}
