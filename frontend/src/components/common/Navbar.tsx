import { Compass, BookOpen, Award, Settings } from 'lucide-react';

interface Props {
  activeTab: 'feed' | 'library' | 'progress' | 'settings';
  setActiveTab: (tab: 'feed' | 'library' | 'progress' | 'settings') => void;
  unreadCount?: number;
}

export function Navbar({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: 'feed', label: 'Feed', icon: Compass },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 py-2 px-4">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 text-xs font-semibold py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 bg-slate-900 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
