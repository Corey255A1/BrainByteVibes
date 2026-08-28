import { useState, useEffect } from 'preact/hooks';
import type { Profile } from '../types';
import { db } from '../db/database';
import { geminiService, type GeminiModelInfo } from '../services/gemini';
import { syncManager } from '../services/sync';
import { forceAppRefresh } from '../utils/pwa';
import { ToastModal } from '../components/common/ToastModal';
import { ModalDialog } from '../components/common/ModalDialog';
import { Key, Server, Tag, Clock, Cpu, RefreshCw, CheckCircle, XCircle, Search, ArrowUpDown, Compass, Zap, RotateCcw, Power, Sliders, Package, UploadCloud, FileArchive, Users, Trash2 } from 'lucide-react';



interface Props {
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
}

export function SettingsPage({ profile, onUpdateProfile }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [readLength, setReadLength] = useState(profile.readLengthMinutes || 5);
  const [preferredModel, setPreferredModel] = useState(profile.preferredModel || 'gemini-1.5-flash');
  const [preferredTopicModel, setPreferredTopicModel] = useState(profile.preferredTopicModel || 'gemini-1.5-flash-8b');
  const [feedLayoutMode, setFeedLayoutMode] = useState<'swipe' | 'classic'>(profile.feedLayoutMode || 'swipe');
  const [models, setModels] = useState<GeminiModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [newCat, setNewCat] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isRestartingServer, setIsRestartingServer] = useState(false);
  const [confirmRestartModal, setConfirmRestartModal] = useState(false);
  const [selectedPackageFile, setSelectedPackageFile] = useState<File | null>(null);
  const [isUploadingPackage, setIsUploadingPackage] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);




  // Model Sorting & Filtering State
  const [modelSearch, setModelSearch] = useState('');
  const [selectedCostFilter, setSelectedCostFilter] = useState<'all' | '💲' | '💲💲' | '💲💲💲'>('all');
  const [sortBy, setSortBy] = useState<'cost_asc' | 'cost_desc' | 'name_asc'>('cost_asc');

  // Stylized Modal Popup State
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message?: string }>({
    isOpen: false,
    title: ''
  });

  const showModal = (title: string, message?: string) => {
    setModalConfig({ isOpen: true, title, message });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    setApiKey(localStorage.getItem('antiscroll_gemini_api_key') || '');
    const currentBackendUrl = syncManager.getBackendUrl();
    setBackendUrl(currentBackendUrl);
    syncManager.checkHealth().then(setIsOnline);
    fetchAvailableModels(currentBackendUrl);
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const remoteUsers = await syncManager.fetchRemoteUsers();
      const localUsers = await db.profiles.toArray();
      const userMap = new Map<string, Profile>();
      remoteUsers.forEach(u => userMap.set(u.id, u));
      localUsers.forEach(u => {
        if (!userMap.has(u.id)) userMap.set(u.id, u);
      });
      setAllUsers(Array.from(userMap.values()));
    } catch (e) {
      console.warn('Failed to load users:', e);
      const localUsers = await db.profiles.toArray();
      setAllUsers(localUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleConfirmDeleteUser = async (targetUser: Profile) => {
    setUserToDelete(null);
    try {
      await syncManager.deleteRemoteUser(targetUser.id);
      await db.profiles.delete(targetUser.id);

      showModal('User Account Deleted', `User "${targetUser.name}" was removed from the database.`);
      await loadAllUsers();
    } catch (e) {
      console.error('Error deleting user account:', e);
      showModal('Deletion Failed', 'Failed to remove user account from database.');
    }
  };


  const fetchAvailableModels = async (bUrl?: string) => {
    setIsLoadingModels(true);
    try {
      const fetched = await geminiService.listModels(bUrl);
      setModels(fetched);
    } catch (e) {
      console.warn('Failed to load models:', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveApiKey = () => {
    geminiService.setApiKey(apiKey.trim());
    showModal('API Key Saved', 'Your Gemini API key has been securely saved in local storage.');
    fetchAvailableModels(backendUrl);
  };

  const handleSaveBackendUrl = () => {
    syncManager.setBackendUrl(backendUrl.trim());
    syncManager.checkHealth().then(setIsOnline);
    showModal('NAS Endpoint Saved', 'Your backend NAS connection URL has been updated.');
    fetchAvailableModels(backendUrl.trim());
  };

  const handleSavePreferences = async () => {
    const updated: Profile = {
      ...profile,
      readLengthMinutes: readLength,
      preferredModel,
      preferredTopicModel,
      feedLayoutMode,
      categories
    };
    await db.profiles.update(profile.id, {
      readLengthMinutes: readLength,
      preferredModel,
      preferredTopicModel,
      feedLayoutMode,
      categories
    });

    // Push updated profile settings to backend NAS server
    await syncManager.pushUserProfile(updated);

    onUpdateProfile(updated);
    showModal('Preferences Saved', 'Your AI topic model, article model, reading duration, and categories have been updated.');
  };

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    if (!categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
    }
    setNewCat('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const triggerManualSync = async () => {
    setSyncStatus('Syncing with NAS...');
    const result = await syncManager.processSyncQueue();
    setSyncStatus(`Sync finished! Processed: ${result.processed}, Errors: ${result.errors}`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleRestartServer = async () => {
    setConfirmRestartModal(false);
    setIsRestartingServer(true);

    try {
      await syncManager.restartServer();
    } catch (e) {
      console.warn('Restart command sent:', e);
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const online = await syncManager.checkHealth();
      setIsOnline(online);

      if (online && attempts > 1) {
        clearInterval(interval);
        setIsRestartingServer(false);
        showModal('Server Restarted', 'Your NAS backend server restarted successfully and is back online!');
      } else if (attempts > 20) {
        clearInterval(interval);
        setIsRestartingServer(false);
        showModal('Restart Command Sent', 'The restart signal was sent. Check your NAS Container Manager logs if it takes longer.');
      }
    }, 1500);
  };

  const handleUploadPackage = async () => {
    if (!selectedPackageFile) return;
    setIsUploadingPackage(true);

    try {
      const res = await syncManager.uploadUpdatePackage(selectedPackageFile);
      console.log('Update result:', res.message);
      setSelectedPackageFile(null);

      // Trigger automatic health polling overlay while container reboots with new update
      setIsRestartingServer(true);
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts += 1;
        const online = await syncManager.checkHealth();
        setIsOnline(online);

        if (online && attempts > 2) {
          clearInterval(interval);
          setIsRestartingServer(false);
          showModal('Update Applied Successfully! 🎉', 'Your NAS backend server extracted the package, rebuilt assets, and restarted cleanly.');
        } else if (attempts > 30) {
          clearInterval(interval);
          setIsRestartingServer(false);
          showModal('Update Processed', 'The package was extracted and update triggered. Check NAS Container Manager logs if it takes longer.');
        }
      }, 1500);
    } catch (e: any) {
      console.error('Error uploading update package:', e);
      showModal('Package Update Failed', e.message || 'Failed to extract update package. Please check file format or server logs.');
    } finally {
      setIsUploadingPackage(false);
    }
  };



  // Filter and sort models
  const filteredAndSortedModels = models
    .filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(modelSearch.toLowerCase());
      const matchesCost =
        selectedCostFilter === 'all' || m.costTier === selectedCostFilter;
      return matchesSearch && matchesCost;
    })
    .sort((a, b) => {
      if (sortBy === 'cost_asc') {
        const costOrder: Record<string, number> = { '💲': 1, '💲💲': 2, '💲💲💲': 3 };
        const diff = (costOrder[a.costTier] || 2) - (costOrder[b.costTier] || 2);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      } else if (sortBy === 'cost_desc') {
        const costOrder: Record<string, number> = { '💲': 1, '💲💲': 2, '💲💲💲': 3 };
        const diff = (costOrder[b.costTier] || 2) - (costOrder[a.costTier] || 2);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-100 px-1">Settings & Integration</h1>

      {/* Gemini API Key */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
          <Key size={18} className="text-amber-400" />
          <span>Gemini API Key (Local PWA Mode)</span>
        </div>
        <p className="text-xs text-slate-400">
          Stored locally in IndexedDB to allow direct AI generation when offline from NAS.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-slate-950 rounded-lg text-xs transition-all"
          >
            Save Key
          </button>
        </div>
      </div>

      {/* Topic Curation AI Model (Fast & Cheap) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
            <Zap size={18} className="text-amber-400" />
            <span>Topic Curation AI Model (Fast & Cheap)</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Used for generating daily topic cards, swipe stream replenishment, and wildcards. Choose a fast, low-cost model (e.g. 💲 8B / Flash).
        </p>
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Topic Curator Model
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={preferredTopicModel}
              onInput={(e) => setPreferredTopicModel((e.target as HTMLInputElement).value)}
              placeholder="e.g. gemini-1.5-flash-8b"
              className="flex-1 px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-amber-300 font-mono text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <span className="text-xs px-2.5 py-2 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-400 font-bold whitespace-nowrap">
              Topic AI
            </span>
          </div>
        </div>
      </div>

      {/* Article & Game AI Model Selector */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
            <Cpu size={18} className="text-emerald-400" />
            <span>Article & Game AI Model (Deep Reasoning)</span>
          </div>
          <button
            onClick={() => fetchAvailableModels(backendUrl)}
            disabled={isLoadingModels}
            className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Select which model to write full micro-articles and interactive mini-games. Cost markers (💲) indicate model expense.
        </p>

        {/* Selected Article Model Display Text Field */}
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Article & Game Model
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={preferredModel}
              onInput={(e) => setPreferredModel((e.target as HTMLInputElement).value)}
              placeholder="e.g. gemini-1.5-flash"
              className="flex-1 px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner"
            />
            <span className="text-xs px-2.5 py-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold whitespace-nowrap">
              Article AI
            </span>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search model name or ID (e.g., flash, 8b, pro)..."
              value={modelSearch}
              onInput={(e) => setModelSearch((e.target as HTMLInputElement).value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Cost Filter Chips */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {(['all', '💲', '💲💲', '💲💲💲'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedCostFilter(tier)}
                  className={`px-2 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCostFilter === tier
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tier === 'all' ? 'All' : tier}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy((e.target as HTMLSelectElement).value as any)}
                className="bg-transparent text-slate-300 text-[11px] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="cost_asc">Cost: Low → High</option>
                <option value="cost_desc">Cost: High → Low</option>
                <option value="name_asc">Name: A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Model Items Container */}
        {isLoadingModels ? (
          <div className="text-xs text-slate-400 py-4 text-center flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-emerald-400" />
            Querying available Gemini models...
          </div>
        ) : filteredAndSortedModels.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
            No models matched your filter search.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredAndSortedModels.map(m => {
              const isArticleSelected = preferredModel === m.id;
              const isTopicSelected = preferredTopicModel === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border transition-all flex flex-col gap-2 bg-slate-950/80 border-slate-800 text-slate-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-800 border border-slate-700 text-amber-300">
                      {m.costTier} ({m.costDescription})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{m.id}</span>
                  {m.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">{m.description}</p>
                  )}

                  {/* Assign Buttons */}
                  <div className="flex gap-2 pt-1 border-t border-slate-900">
                    <button
                      onClick={() => setPreferredTopicModel(m.id)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                        isTopicSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-amber-300'
                      }`}
                    >
                      {isTopicSelected ? '✓ Active Topic AI' : 'Set as Topic AI (⚡)'}
                    </button>
                    <button
                      onClick={() => setPreferredModel(m.id)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                        isArticleSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-emerald-300'
                      }`}
                    >
                      {isArticleSelected ? '✓ Active Article AI' : 'Set as Article AI (📖)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NAS Backend Sync Configuration */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
            <Server size={18} className="text-sky-400" />
            <span>NAS Backend Connection</span>
          </div>
          {isOnline !== null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
            }`}>
              {isOnline ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          REST API endpoint for FastAPI backend running on home server.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="http://localhost:8000/api"
            value={backendUrl}
            onInput={(e) => setBackendUrl((e.target as HTMLInputElement).value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-sky-400"
          />
          <button
            onClick={handleSaveBackendUrl}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 font-bold text-white rounded-lg text-xs transition-all"
          >
            Save URL
          </button>
        </div>
        <button
          onClick={triggerManualSync}
          className="mt-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
        >
          <RefreshCw size={14} /> Sync Offline Queue Now
        </button>
        {syncStatus && <p className="text-[11px] text-emerald-400 text-center font-semibold">{syncStatus}</p>}
      </div>

      {/* Target Read Length, Feed Mode & Categories */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200 mb-2">
            <Compass size={18} className="text-teal-400" />
            <span>Feed Display Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFeedLayoutMode('swipe')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feedLayoutMode === 'swipe'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold text-xs text-white">🎴 Swipe Stack (Default)</span>
              <span className="text-[10px] text-slate-400 leading-tight">
                Swipe left/right/down. Never-ending AI topic stream.
              </span>
            </button>
            <button
              onClick={() => setFeedLayoutMode('classic')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feedLayoutMode === 'classic'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold text-xs text-white">📋 Classic Deck List</span>
              <span className="text-[10px] text-slate-400 leading-tight">
                5-topic card deck list with manual refresh.
              </span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200 mb-2">
            <Clock size={18} className="text-emerald-400" />
            <span>Target Reading Duration</span>
          </div>
          <div className="flex gap-2">
            {[2, 5, 10].map(m => (
              <button
                key={m}
                onClick={() => setReadLength(m)}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                  readLength === m ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {m} Minutes
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200 mb-2">
            <Tag size={18} className="text-purple-400" />
            <span>Interest Categories</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map(cat => (
              <span key={cat} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-full text-xs flex items-center gap-1.5">
                {cat}
                <button onClick={() => handleRemoveCategory(cat)} className="text-slate-400 hover:text-rose-400">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new category..."
              value={newCat}
              onInput={(e) => setNewCat((e.target as HTMLInputElement).value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-lg text-xs transition-all"
            >
              Add
            </button>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 rounded-lg text-xs shadow-md transition-all mt-2"
        >
          Save Profile Preferences
        </button>
      </div>

      {/* Advanced Settings & Server Control Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-amber-400" />
            <h2 className="font-bold text-base text-white">Advanced Settings & Server Control</h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            NAS Container
          </span>
        </div>

        {/* NAS Backend Endpoint Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Server size={14} className="text-cyan-400" />
              <span>NAS Backend Connection URL</span>
            </label>
            {isOnline !== null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-rose-950 text-rose-400 border-rose-500/30'
              }`}>
                {isOnline ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={backendUrl}
              onInput={(e) => setBackendUrl((e.target as HTMLInputElement).value)}
              placeholder="e.g. http://192.168.1.100:8000/api or http://localhost:8000/api"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleSaveBackendUrl}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl text-xs transition-all shadow-md"
            >
              Save URL
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Specify your NAS server IP or hostname. Used for syncing articles, reading logs, and AI course models.
          </p>
        </div>

        {/* OTA Package Upload & Update */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package size={14} className="text-purple-400" />
              <span>Upload OTA Update Package (.tgz)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload a code archive package (.tgz / .tar.gz). The server will extract it, rebuild assets, and reboot automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all text-xs">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <FileArchive size={16} className="text-purple-400 shrink-0" />
                <span className="truncate">
                  {selectedPackageFile ? selectedPackageFile.name : 'Choose update package (.tgz)...'}
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono shrink-0 ml-2">
                {selectedPackageFile ? `${(selectedPackageFile.size / 1024 / 1024).toFixed(1)} MB` : 'Browse'}
              </span>
              <input
                type="file"
                accept=".tgz,.tar.gz,.tar"
                onChange={(e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files[0]) {
                    setSelectedPackageFile(files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            <button
              onClick={handleUploadPackage}
              disabled={!selectedPackageFile || isUploadingPackage}
              className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isUploadingPackage ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Extracting & Applying...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Upload & Apply Update</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manage & Delete Database Users */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users size={14} className="text-rose-400" />
                <span>Database User Accounts ({allUsers.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Remove users from the SQLModel database. Articles and course files on disk remain unaffected.
              </p>
            </div>
            <button
              onClick={loadAllUsers}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs"
              title="Refresh User List"
            >
              <RefreshCw size={14} className={isLoadingUsers ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {allUsers.length === 0 ? (
              <div className="p-4 text-center bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500">
                No users found in backend database.
              </div>
            ) : (
              allUsers.map(u => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-lg p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {u.avatarEmoji || '🧑‍💻'}
                    </span>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{u.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setUserToDelete(u)}
                    title={`Delete ${u.name} from database`}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Force PWA Refresh / Clear SW Cache */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <RefreshCw size={14} className="text-cyan-400" />
                <span>Force PWA Refresh & Clear Cache</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Purges stale Service Worker static file caches and reloads client assets directly from the server. (User profiles & articles remain safe).
              </p>
            </div>
            <button
              onClick={() => forceAppRefresh()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Force Refresh</span>
            </button>
          </div>
        </div>

        {/* Server Restart Control */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <RotateCcw size={14} className="text-amber-400" />
                <span>Restart Backend Server</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Reboot the backend container process to apply newly uploaded code/files without opening Container Manager.
              </p>
            </div>
            <button
              onClick={() => setConfirmRestartModal(true)}
              disabled={isRestartingServer || isUploadingPackage}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
            >
              <Power size={14} />
              <span>Restart Server</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for User Deletion */}
      {userToDelete && (
        <ModalDialog
          isOpen={true}
          title={`Delete User "${userToDelete.name}"?`}
          message={`Are you sure you want to remove ${userToDelete.name} from the database? Saved articles and course files on disk will NOT be affected.`}
          variant="danger"
          confirmLabel="Delete User"
          cancelLabel="Cancel"
          onConfirm={() => handleConfirmDeleteUser(userToDelete)}
          onCancel={() => setUserToDelete(null)}
        />
      )}

      {/* Confirmation Modal for Server Restart */}
      {confirmRestartModal && (
        <ModalDialog
          isOpen={true}
          title="Restart Backend NAS Server?"
          message="This will reboot the server process to reload your updated code files. The container will restart in ~1-2 seconds."
          variant="warning"
          confirmLabel="Restart Server"
          cancelLabel="Cancel"
          onConfirm={handleRestartServer}
          onCancel={() => setConfirmRestartModal(false)}
        />
      )}

      {/* Restarting Server Loading Modal Overlay */}
      {isRestartingServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
              <RefreshCw size={28} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Restarting NAS Server...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Rebooting the container process to apply your updated files. Reconnecting automatically...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stylized Toast Modal Dialog */}
      <ToastModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={closeModal}
      />
    </div>
  );
}

