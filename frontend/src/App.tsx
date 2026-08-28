import { useState, useEffect } from 'preact/hooks';
import type { Profile, TopicCard as ITopicCard } from './types';
import { db } from './db/database';
import { syncManager } from './services/sync';
import { Navbar } from './components/common/Navbar';
import { ProfileSwitcher } from './components/common/ProfileSwitcher';
import { ProfileSelectModal } from './components/common/ProfileSelectModal';
import { FeedPage } from './pages/FeedPage';
import { CoursesPage } from './pages/CoursesPage';
import { ReaderPage } from './pages/ReaderPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

import { forceAppRefresh } from './utils/pwa';
import { Sparkles, RefreshCw } from 'lucide-react';

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileSelectModal, setShowProfileSelectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'courses' | 'library' | 'progress' | 'settings'>('feed');
  const [selectedTopic, setSelectedTopic] = useState<ITopicCard | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [hasUpdateBanner, setHasUpdateBanner] = useState(false);

  useEffect(() => {
    loadCachedOrInitialProfile();

    const handleOnline = () => {
      console.log('[BrainByte] Network connection restored. Flushing sync queue to NAS...');
      syncManager.processSyncQueue();
    };

    const handleSwUpdate = () => {
      console.log('[BrainByte] PWA update detected!');
      setHasUpdateBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('brainbyte-sw-update', handleSwUpdate);

    // Periodically poll server health to detect container restarts / new builds
    let initialServerTime: number | null = null;
    const versionCheckInterval = setInterval(async () => {
      try {
        const backendUrl = syncManager.getBackendUrl().replace(/\/api$/, '');
        const res = await fetch(`${backendUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          if (data.server_start_time) {
            if (initialServerTime === null) {
              initialServerTime = data.server_start_time;
            } else if (data.server_start_time !== initialServerTime) {
              console.log('[BrainByte] Server rebooted with new version!');
              setHasUpdateBanner(true);
            }
          }
        }
      } catch (e) {
        // Offline or unreachable
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('brainbyte-sw-update', handleSwUpdate);
      clearInterval(versionCheckInterval);
    };
  }, []);


  const loadCachedOrInitialProfile = async () => {
    const cachedId = localStorage.getItem('brainbyte_active_user_id');
    if (cachedId) {
      const cachedProfile = await db.profiles.get(cachedId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        setShowProfileSelectModal(false);
        return;
      }
    }

    // No cached user ID exists -> prompt profile selection modal
    setShowProfileSelectModal(true);
  };

  const handleSelectProfile = (selected: Profile) => {
    localStorage.setItem('brainbyte_active_user_id', selected.id);
    setProfile(selected);
    setIsReading(false);
    setSelectedTopic(null);
    setSelectedArticleId(null);
    setShowProfileSelectModal(false);

    // Trigger sync for the newly selected profile
    syncManager.processSyncQueue();
  };

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
      {/* Profile Selection Modal (If no user is selected) */}
      {showProfileSelectModal && (
        <ProfileSelectModal onSelectProfile={handleSelectProfile} />
      )}

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
          {profile && (
            <ProfileSwitcher currentProfile={profile} onSelectProfile={handleSelectProfile} />
          )}
        </div>
      </header>

      {/* Main View Area (Keyed by profile.id to force clean re-mount when switching users) */}
      <main className="min-h-[calc(100vh-60px)]">
        {profile ? (
          isReading ? (
            <ReaderPage
              key={`reader-${profile.id}-${selectedTopic?.id || selectedArticleId}`}
              profile={profile}
              topicCard={selectedTopic}
              articleId={selectedArticleId}
              onBack={handleBackFromReader}
            />
          ) : (
            <>
              {activeTab === 'feed' && (
                <FeedPage key={`feed-${profile.id}`} profile={profile} onSelectTopic={handleSelectTopicCard} />
              )}
              {activeTab === 'courses' && (
                <CoursesPage key={`courses-${profile.id}`} profile={profile} />
              )}
              {activeTab === 'library' && (
                <LibraryPage key={`library-${profile.id}`} profile={profile} onSelectArticle={handleSelectLibraryArticle} />
              )}
              {activeTab === 'progress' && (
                <ProgressPage key={`progress-${profile.id}`} profile={profile} />
              )}
              {activeTab === 'settings' && (
                <SettingsPage key={`settings-${profile.id}`} profile={profile} onUpdateProfile={handleSelectProfile} />
              )}
            </>
          )
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="animate-pulse text-sm text-slate-400 font-semibold">
              Select or create a user profile to start...
            </div>
          </div>
        )}
      </main>

      {/* Floating PWA Update Notification Banner */}
      {hasUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold text-xs py-2 px-4 shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>A new BrainByte update is ready!</span>
          </div>
          <button
            onClick={() => forceAppRefresh()}
            className="px-3 py-1 bg-slate-950 text-emerald-400 font-extrabold rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Update & Reload</span>
          </button>
        </div>
      )}

      {/* Bottom Navbar (Hidden during active article reading or modal) */}
      {!isReading && profile && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}

