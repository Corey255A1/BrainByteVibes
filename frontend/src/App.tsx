import { useState, useEffect } from 'preact/hooks';
import type { Profile, TopicCard as ITopicCard } from './types';
import { ensureDefaultProfile } from './db/database';
import { Navbar } from './components/common/Navbar';
import { ProfileSwitcher } from './components/common/ProfileSwitcher';
import { FeedPage } from './pages/FeedPage';
import { ReaderPage } from './pages/ReaderPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'library' | 'progress' | 'settings'>('feed');
  const [selectedTopic, setSelectedTopic] = useState<ITopicCard | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    ensureDefaultProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="animate-pulse text-sm text-slate-400 font-semibold">Initializing AntiScroll...</div>
      </div>
    );
  }

  const handleSelectTopicCard = (topic: ITopicCard) => {
    setSelectedTopic(topic);
    setSelectedArticleId(null);
    setIsReading(true);
  };

  const handleSelectLibraryArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setSelectedTopic(null);
    setIsReading(true);
  };

  const handleBackFromReader = () => {
    setIsReading(false);
    setSelectedTopic(null);
    setSelectedArticleId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              BrainByte
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              🧠 Micro-Learning
            </span>
          </div>
          <ProfileSwitcher currentProfile={profile} onSelectProfile={setProfile} />
        </div>
      </header>

      {/* Main View Area */}
      <main className="min-h-[calc(100vh-60px)]">
        {isReading ? (
          <ReaderPage
            profile={profile}
            topicCard={selectedTopic}
            articleId={selectedArticleId}
            onBack={handleBackFromReader}
          />
        ) : (
          <>
            {activeTab === 'feed' && (
              <FeedPage profile={profile} onSelectTopic={handleSelectTopicCard} />
            )}
            {activeTab === 'library' && (
              <LibraryPage profile={profile} onSelectArticle={handleSelectLibraryArticle} />
            )}
            {activeTab === 'progress' && (
              <ProgressPage profile={profile} />
            )}
            {activeTab === 'settings' && (
              <SettingsPage profile={profile} onUpdateProfile={setProfile} />
            )}
          </>
        )}
      </main>

      {/* Bottom Navbar (Hidden during active article reading) */}
      {!isReading && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
