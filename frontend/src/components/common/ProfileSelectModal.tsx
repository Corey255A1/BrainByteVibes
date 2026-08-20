import { useState, useEffect } from 'preact/hooks';
import type { Profile } from '../../types';
import { db } from '../../db/database';
import { CreateProfileWizard } from './CreateProfileWizard';
import { Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  onSelectProfile: (profile: Profile) => void;
}

export function ProfileSelectModal({ onSelectProfile }: Props) {
  const [existingProfiles, setExistingProfiles] = useState<Profile[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    db.profiles.toArray().then(profs => {
      setExistingProfiles(profs);
      if (profs.length === 0) {
        setIsCreatingNew(true);
      }
    });
  }, []);

  const handleSelect = (profile: Profile) => {
    localStorage.setItem('brainbyte_active_user_id', profile.id);
    onSelectProfile(profile);
  };

  if (isCreatingNew) {
    return (
      <CreateProfileWizard
        onComplete={onSelectProfile}
        onCancel={existingProfiles.length > 0 ? () => setIsCreatingNew(false) : undefined}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-950">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Sparkles size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Welcome to BrainByte
          </h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Select who is learning today, or create a new profile to start swiping.
          </p>
        </div>

        {/* Existing Profiles List */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex justify-between items-center">
            <span>Select Profile</span>
            <span className="text-[10px] text-emerald-400 font-mono">{existingProfiles.length} Saved</span>
          </div>
          
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {existingProfiles.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/30 flex items-center justify-between transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {p.avatarEmoji}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-emerald-300">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {p.categories.slice(0, 3).join(' • ')}
                    </p>
                  </div>
                </div>
                <CheckCircle2 size={20} className="text-slate-600 group-hover:text-emerald-400" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="mt-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={16} /> Create New Profile
          </button>
        </div>
      </div>
    </div>
  );
}
