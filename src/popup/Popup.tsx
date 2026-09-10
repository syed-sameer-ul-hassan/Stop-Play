import { useEffect, useState, useCallback } from 'react';
import {
  ExternalLink,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { ExtensionSettings, VideoState, DEFAULT_SETTINGS } from '../shared/types';
import { getSettings, saveSettings } from '../shared/storage';
import { Logo } from '../shared/Logo';

interface PlayingTabInfo {
  tabId: number;
  windowId: number;
  state: VideoState;
  isCurrentTab: boolean;
  isLocked?: boolean;
}

function SiteAvatar({
  domain,
  favicon,
  size = 'large',
}: {
  domain: string;
  favicon?: string;
  size?: 'large' | 'small';
}) {
  const googleFavicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
  const [currentSrc, setCurrentSrc] = useState<string>(favicon || googleFavicon);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(favicon || googleFavicon);
    setHasError(false);
  }, [favicon, domain, googleFavicon]);

  const handleError = () => {
    if (currentSrc !== googleFavicon && googleFavicon) {
      setCurrentSrc(googleFavicon);
    } else {
      setHasError(true);
    }
  };

  if (size === 'large') {
    return (
      <div className="relative w-11 h-11 rounded-xl bg-[#0f121a] border border-white/[0.12] overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-lg group-hover:border-white/25 transition-all">
        {!hasError && currentSrc ? (
          <img
            src={currentSrc}
            alt={domain}
            onError={handleError}
            className="w-6 h-6 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono text-blue-400">
            {domain ? domain.charAt(0).toUpperCase() : <Play className="w-4 h-4 text-blue-400" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-lg bg-[#0f121a] border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm">
      {!hasError && currentSrc ? (
        <img
          src={currentSrc}
          alt={domain}
          onError={handleError}
          className="w-4 h-4 object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold font-mono text-slate-400">
          {domain ? domain.charAt(0).toUpperCase() : <Play className="w-2.5 h-2.5 text-slate-500" />}
        </div>
      )}
    </div>
  );
}

export default function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [playingTabs, setPlayingTabs] = useState<PlayingTabInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchPlayingTabs = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;

    chrome.runtime.sendMessage({ type: 'GET_ALL_PLAYING_TABS' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res && Array.isArray(res.playingTabs)) {
        setPlayingTabs(res.playingTabs);
      }
    });
  }, []);

  const handleJumpToTab = useCallback((tabId: number) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'JUMP_TO_TAB', tabId });
    }
  }, []);

  const handleTogglePauseTab = useCallback((tabId: number, currentlyPlaying: boolean) => {
    setActionLoadingId(tabId);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const type = currentlyPlaying ? 'PAUSE_TAB_VIDEO' : 'RESUME_TAB_VIDEO';
      chrome.runtime.sendMessage({ type, tabId }, () => {
        setActionLoadingId(null);
        fetchPlayingTabs();
      });
    } else {
      setActionLoadingId(null);
    }
  }, [fetchPlayingTabs]);

  const handleToggleLockTab = useCallback((tabId: number) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'TOGGLE_TAB_LOCK', tabId }, () => {
        fetchPlayingTabs();
      });
    }
  }, [fetchPlayingTabs]);

  const handleOpenOptions = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  }, []);

  useEffect(() => {
    async function init() {
      const s = await getSettings();
      setSettings(s);
      fetchPlayingTabs();
      setLoading(false);
    }
    init();

    const interval = setInterval(fetchPlayingTabs, 1200);

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.stop_play_settings) {
        setSettings(changes.stop_play_settings.newValue || DEFAULT_SETTINGS);
      }
      if (changes.stop_play_tab_states) {
        fetchPlayingTabs();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(storageListener);
    }

    return () => {
      clearInterval(interval);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, [fetchPlayingTabs]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (playingTabs.length > 0) {
          const target = playingTabs[0];
          handleTogglePauseTab(target.tabId, target.state.isPlaying);
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (playingTabs.length > 0) {
          handleJumpToTab(playingTabs[0].tabId);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (playingTabs.length > 0) {
          handleToggleLockTab(playingTabs[0].tabId);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleOpenOptions();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingTabs, handleTogglePauseTab, handleJumpToTab, handleToggleLockTab, handleOpenOptions]);

  async function handleToggleEnabled() {
    const updated = !settings.enabled;
    const newSettings = await saveSettings({ enabled: updated });
    setSettings(newSettings);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { enabled: updated } });
    }
  }

  function handleToggleMuteDomain(domain: string) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'TOGGLE_MUTE_DOMAIN', domain }, (res) => {
        if (res && res.muteList) {
          setSettings((prev) => ({ ...prev, muteList: res.muteList }));
        }
      });
    }
  }

  const heroItem = playingTabs.find((t) => !t.isCurrentTab) || playingTabs[0];
  const queueItems = playingTabs.filter((t) => t.tabId !== heroItem?.tabId);

  return (
    <div className="w-full bg-[#090a0f] text-slate-100 flex flex-col min-h-[380px] max-h-[580px] select-none font-sans antialiased">
      <header className="px-4 py-3 border-b border-white/[0.06] bg-[#0d0e14]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <Logo className="w-6 h-6" />
          <span className="font-semibold text-xs text-white tracking-tight">Stop Play</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenOptions}
            title="Preferences (S)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {!settings.enabled && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200/90">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Auto-pause is currently disabled
            </span>
            <button
              onClick={handleToggleEnabled}
              className="text-[10px] font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-100"
            >
              Enable
            </button>
          </div>
        )}

        {playingTabs.length === 0 && !loading && (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border border-white/[0.06] animate-radar" />
              <div className="absolute inset-2 rounded-full border border-blue-500/10" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#181b24] to-[#101218] border border-white/[0.1] flex items-center justify-center shadow-inner">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-white tracking-tight">No Active Media</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mt-1 leading-relaxed">
              Videos will appear here with automatic background pause & resume.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <kbd className="kbd-hint">Ctrl</kbd> + <kbd className="kbd-hint">T</kbd>
              <span>to switch tabs</span>
            </div>
          </div>
        )}

        {heroItem && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              <span>Now Playing</span>
              {heroItem.isLocked && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  <span>BG Lock Active</span>
                </span>
              )}
            </div>

            <div className="surface-card-active rounded-xl p-3.5 transition-all relative overflow-hidden group">
              <div className="flex items-start gap-3">
                <SiteAvatar
                  domain={heroItem.state.domain}
                  favicon={heroItem.state.favicon}
                  size="large"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                      {heroItem.state.domain}
                    </span>

                    {heroItem.state.isPlaying && (
                      <div className="flex items-end gap-[2px] h-3 shrink-0">
                        <div className="w-[2px] bg-blue-400 rounded-full animate-eq-1" />
                        <div className="w-[2px] bg-blue-400 rounded-full animate-eq-2" />
                        <div className="w-[2px] bg-blue-400 rounded-full animate-eq-3" />
                        <div className="w-[2px] bg-blue-400 rounded-full animate-eq-4" />
                      </div>
                    )}
                  </div>

                  <h2
                    className="text-xs font-semibold text-white truncate mt-0.5 tracking-tight"
                    title={heroItem.state.title}
                  >
                    {heroItem.state.title || 'Playing Video'}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => handleToggleLockTab(heroItem.tabId)}
                title={
                  heroItem.isLocked
                    ? 'Background Lock ON: This tab never auto-pauses when switching away. Click to enable auto-pause.'
                    : 'Click to Lock: Keep this tab playing in background while other tabs auto-pause.'
                }
                className={`w-full mt-3 py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs font-medium border transition-all active:scale-[0.98] ${
                  heroItem.isLocked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Headphones className={`w-3.5 h-3.5 ${heroItem.isLocked ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-[11px]">Keep Playing in Background</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    heroItem.isLocked
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-white/[0.05] text-slate-400'
                  }`}
                >
                  {heroItem.isLocked ? 'Locked (Plays)' : 'Auto-Pause (L)'}
                </span>
              </button>

              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    onClick={() => handleTogglePauseTab(heroItem.tabId, heroItem.state.isPlaying)}
                    disabled={actionLoadingId === heroItem.tabId}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                      heroItem.state.isPlaying
                        ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.12]'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                    }`}
                  >
                    {heroItem.state.isPlaying ? (
                      <>
                        <Pause className="w-3 h-3 text-rose-400" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current text-white" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleJumpToTab(heroItem.tabId)}
                    title="Focus this tab"
                    className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Jump</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleMuteDomain(heroItem.state.domain)}
                  title={`Toggle alerts for ${heroItem.state.domain}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                >
                  {settings.muteList.includes(heroItem.state.domain) ? (
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {queueItems.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Other Media ({queueItems.length})
            </div>
            <div className="space-y-1.5">
              {queueItems.map((item) => (
                <div
                  key={item.tabId}
                  className="surface-card rounded-lg p-2.5 flex items-center justify-between gap-2 hover:border-white/[0.14] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <SiteAvatar
                      domain={item.state.domain}
                      favicon={item.state.favicon}
                      size="small"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {item.state.title || 'Audio/Video Tab'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                        <span>{item.state.domain}</span>
                        {item.isLocked && (
                          <span className="text-emerald-400 font-mono text-[9px] font-semibold">
                            • Locked (Plays in BG)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleLockTab(item.tabId)}
                      className={`p-1 rounded transition-colors ${
                        item.isLocked
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={item.isLocked ? 'Locked to keep playing' : 'Lock to keep playing'}
                    >
                      <Headphones className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTogglePauseTab(item.tabId, item.state.isPlaying)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title={item.state.isPlaying ? 'Pause' : 'Resume'}
                    >
                      {item.state.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleJumpToTab(item.tabId)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title="Jump to tab"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export { Popup };
