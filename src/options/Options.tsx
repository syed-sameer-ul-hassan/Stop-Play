import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  Monitor,
  PauseOctagon,
  Plus,
  SlidersHorizontal,
  Sparkles,
  VolumeX,
  X,
  Layout,
  Play,
  RotateCcw,
  Search,
  Command,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  Tv,
  Headphones,
  Globe,
  ExternalLink,
  Code2,
  MessageSquare,
  History,
  Shield,
  Star
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
import { ExtensionSettings, DEFAULT_SETTINGS } from '../shared/types';
import { getSettings, saveSettings } from '../shared/storage';
import { Logo } from '../shared/Logo';

const POPULAR_MUSIC_SITES = [
  { name: 'Spotify', domain: 'open.spotify.com' },
  { name: 'Apple Music', domain: 'music.apple.com' },
  { name: 'SoundCloud', domain: 'soundcloud.com' },
  { name: 'YouTube Music', domain: 'music.youtube.com' },
  { name: 'Twitch', domain: 'twitch.tv' },
  { name: 'Netflix', domain: 'netflix.com' },
];

type ActiveSection =
  | 'playback'
  | 'alerts'
  | 'lock'
  | 'allowlist'
  | 'shortcuts'
  | 'developer'
  | 'changelog';

export default function Options() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('playback');
  const [newDomain, setNewDomain] = useState('');
  const [domainSearch, setDomainSearch] = useState('');
  const [domainError, setDomainError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showSimulatedHUD, setShowSimulatedHUD] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  async function updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    val: ExtensionSettings[K]
  ) {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    await saveSettings(updated);

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { [key]: val } });
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  }

  async function handleResetDefaults() {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: DEFAULT_SETTINGS });
    }
    setShowResetConfirm(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  }

  function handleAddDomain(domainToAdd?: string) {
    const raw = domainToAdd || newDomain;
    let clean = raw.trim().toLowerCase();
    if (!clean) return;

    try {
      if (clean.includes('://')) {
        clean = new URL(clean).hostname;
      } else if (clean.includes('/')) {
        clean = clean.split('/')[0];
      }
    } catch {
    }

    if (!clean.includes('.') || clean.length < 3) {
      setDomainError('Please enter a valid domain (e.g. lofi.cafe)');
      setTimeout(() => setDomainError(''), 3000);
      return;
    }

    if (settings.muteList.includes(clean)) {
      setDomainError('Domain is already in allowlist');
      setTimeout(() => setDomainError(''), 2500);
      return;
    }

    const updatedList = [...settings.muteList, clean];
    updateSetting('muteList', updatedList);
    setNewDomain('');
    setDomainError('');
  }

  function handleRemoveDomain(domainToRemove: string) {
    const updatedList = settings.muteList.filter((d) => d !== domainToRemove);
    updateSetting('muteList', updatedList);
  }

  function handleTriggerTestNotification() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' }, () => {
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      });
    } else {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    }
  }

  function triggerSimulatedHUD() {
    setShowSimulatedHUD(true);
    setTimeout(() => setShowSimulatedHUD(false), 4500);
  }

  const filteredMuteList = settings.muteList.filter((domain) =>
    domain.toLowerCase().includes(domainSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>LOADING STUDIO PREFERENCES...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-rose-500 selection:text-white">
      <aside className="w-full md:w-64 bg-[#0a0c12] border-r border-white/[0.06] flex flex-col justify-between shrink-0 p-4 sticky top-0 md:h-screen z-30">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">Stop Play</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-400">
                    v1.2
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Control Studio</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-xl p-3 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${settings.enabled
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400'
                  }`}
              />
              <div className="text-[11px]">
                <div className="font-semibold text-white leading-tight">
                  {settings.enabled ? 'Guardian Active' : 'Guardian Paused'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {settings.enabled ? 'Protecting media' : 'Bypassed'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <nav className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Media Engine
            </div>

            <button
              onClick={() => setActiveSection('playback')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'playback'
                ? 'bg-blue-600/15 text-white border border-blue-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Playback & Triggers</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('alerts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'alerts'
                ? 'bg-cyan-600/15 text-white border border-cyan-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Layout className="w-3.5 h-3.5 text-cyan-400" />
                <span>Alerts & Island HUD</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('lock')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'lock'
                ? 'bg-emerald-600/15 text-white border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>Background Lock</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                New
              </span>
            </button>

            <button
              onClick={() => setActiveSection('allowlist')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'allowlist'
                ? 'bg-amber-600/15 text-white border border-amber-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span>Muted Allowlist</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-300">
                {settings.muteList.length}
              </span>
            </button>

            <div className="px-2 pt-4 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              System & Community
            </div>

            <button
              onClick={() => setActiveSection('shortcuts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'shortcuts'
                ? 'bg-purple-600/15 text-white border border-purple-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Command className="w-3.5 h-3.5 text-purple-400" />
                <span>Shortcuts & Hotkeys</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('developer')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'developer'
                ? 'bg-rose-600/15 text-white border border-rose-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Developer & Links</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Portfolio
              </span>
            </button>

            <button
              onClick={() => setActiveSection('changelog')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === 'changelog'
                ? 'bg-slate-700/30 text-white border border-white/20 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Changelog</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/[0.06] space-y-2">
          <div className="p-3 rounded-xl bg-[#0e111a] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <img
                src="https://github.com/syed-sameer-ul-hassan.png"
                alt="Syed Sameer Ul Hassan"
                className="w-8 h-8 rounded-full border border-white/20 object-cover shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">Syed Sameer Ul Hassan</div>
                <div className="text-[10px] text-slate-400 truncate">Extension Creator</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04] text-[10px]">
              <a
                href="https://github.com/syed-sameer-ul-hassan/Stop-Play"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <GithubIcon className="w-3 h-3" />
                <span>Repo</span>
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://sameer.orildo.dev"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors font-medium"
              >
                <Globe className="w-3 h-3" />
                <span>Portfolio</span>
              </a>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => setActiveSection('developer')}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                More
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#07080b] overflow-y-auto">
        <header className="glass-header sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Logo className="w-4 h-4" glow={false} />
            <span className="text-slate-400">Settings</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white capitalize">
              {activeSection === 'playback' && 'Playback & Triggers'}
              {activeSection === 'alerts' && 'Alerts & Dynamic Island HUD'}
              {activeSection === 'lock' && 'Background Audio Lock'}
              {activeSection === 'allowlist' && 'Muted Site Allowlist'}
              {activeSection === 'shortcuts' && 'Shortcuts & Keyboard Navigation'}
              {activeSection === 'developer' && 'Developer Portfolio & GitHub'}
              {activeSection === 'changelog' && 'Version Changelog & Roadmap'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs text-emerald-400 transition-opacity duration-300 font-medium ${savedFeedback ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Synced with Chrome</span>
            </div>

            <button
              onClick={handleTriggerTestNotification}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1a1e2d] text-xs font-medium text-slate-200 border border-white/[0.08] hover:border-white/20 transition-all active:scale-95 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span>{testNotificationSent ? 'Dispatched!' : 'Test Alert'}</span>
            </button>

            {showResetConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-rose-300 text-[11px]">Reset all?</span>
                <button
                  onClick={handleResetDefaults}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[10px] px-1.5 py-0.5 text-slate-400 hover:text-slate-200"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Reset all settings to defaults"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        <div className="max-w-4xl w-full mx-auto p-6 md:p-8 flex-1 space-y-6">
          {activeSection === 'playback' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Playback & Triggers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure real-time video detection rules and automated pause/resume actions.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5 border border-white/[0.08] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {settings.enabled ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    )}
                    <h3 className="text-sm font-semibold text-white">Master Video Guardian</h3>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Continuously listens for HTML5 media across all tabs and enforces auto-pause and
                    auto-resume when switching.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => updateSetting('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                </label>
              </div>

              <div className="surface-card rounded-2xl p-5 border border-rose-500/20 bg-gradient-to-r from-rose-950/10 to-transparent flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PauseOctagon className="w-4 h-4 text-rose-400" />
                    <h4 className="text-sm font-semibold text-rose-100">Auto-Pause on Switch</h4>
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Default
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Automatically pause playing videos in the browser page immediately when you switch
                    away to another tab or external application.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.autoPauseOnSwitch}
                    onChange={(e) => updateSetting('autoPauseOnSwitch', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                </label>
              </div>

              <div className="surface-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-transparent flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-emerald-100">Auto-Resume on Return</h4>
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Instant
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    When you switch back to the video tab (or refocus Chrome), automatically resume
                    playing every single time right where you paused.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.autoResumeOnReturn}
                    onChange={(e) => updateSetting('autoResumeOnReturn', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="surface-card rounded-2xl p-5 border border-white/[0.06] flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-semibold text-white">Tab Switch Trigger</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Detects when you switch between active browser tabs in Chrome.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={settings.tabSwitchAlerts}
                      onChange={(e) => updateSetting('tabSwitchAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="surface-card rounded-2xl p-5 border border-white/[0.06] flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-semibold text-white">External App Switch</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Detects when you switch away from Chrome to VS Code, Slack, or desktop apps.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={settings.appSwitchAlerts}
                      onChange={(e) => updateSetting('appSwitchAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'alerts' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Alerts & Dynamic Island HUD</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the appearance, duration, and frequency of notifications.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Notification Display Mode
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => updateSetting('notificationStyle', 'banner')}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.notificationStyle === 'banner'
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-[#121520] border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">Dynamic Island</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        In-Page HUD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sleek floating pill injected top-center on the webpage. Non-intrusive & isolated.
                    </p>
                  </button>

                  <button
                    onClick={() => updateSetting('notificationStyle', 'both')}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.notificationStyle === 'both'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-[#121520] border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">Dual Hybrid</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Dynamic Island inside the browser + Native OS alert when switching to other apps.
                    </p>
                  </button>

                  <button
                    onClick={() => updateSetting('notificationStyle', 'system')}
                    className={`p-4 rounded-xl border text-left transition-all ${settings.notificationStyle === 'system'
                      ? 'bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-[#121520] border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">Native System</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Desktop
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Traditional Chrome OS desktop notification cards with Resume and Jump buttons.
                    </p>
                  </button>
                </div>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Live Dynamic Island Simulator
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Preview how the floating glass HUD animates right on the page.
                    </p>
                  </div>
                  <button
                    onClick={triggerSimulatedHUD}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate HUD</span>
                  </button>
                </div>

                <div className="rounded-xl bg-[#06070a] border border-white/[0.08] p-4 relative h-36 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                      <span className="ml-2">youtube.com/watch?v=sample</span>
                    </div>
                    <span>1080p HD</span>
                  </div>

                  <div className="flex justify-center items-center flex-1">
                    {showSimulatedHUD ? (
                      <div className="animate-bounce flex items-center gap-3 px-4 py-2 rounded-full bg-[#121520]/95 border border-white/20 shadow-2xl backdrop-blur-xl transition-all">
                        <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">Paused</span>
                          <span className="text-[11px] text-slate-400 font-mono">• Switching tab</span>
                        </div>
                        <div className="flex items-center gap-0.5 ml-1">
                          <span className="w-0.5 h-3 bg-rose-400 rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-rose-400 rounded-full" />
                          <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">
                        Click &quot;Simulate HUD&quot; to test animation
                      </span>
                    )}
                  </div>

                  <div className="text-right text-[10px] text-slate-600 font-mono">
                    Isolated Shadow DOM • Zero style leak
                  </div>
                </div>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-slate-200">
                      Only notify once per video / tab
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-lg">
                      Alerts on the first switch. Subsequent switches pause and resume completely
                      silently without repeating notifications.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={settings.notifyOncePerTab}
                      onChange={(e) => updateSetting('notifyOncePerTab', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1a1d28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Notification Cooldown</span>
                      </label>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#161a26] text-blue-400 border border-white/[0.08]">
                        {settings.cooldownSeconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="180"
                      step="5"
                      value={settings.cooldownSeconds}
                      onChange={(e) => updateSetting('cooldownSeconds', Number(e.target.value))}
                      className="w-full h-1.5 bg-[#181b26] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">
                      Suppresses alert spam for the same ongoing stream within this window.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>HUD Auto-Dismiss</span>
                      </label>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#161a26] text-purple-400 border border-white/[0.08]">
                        {settings.notificationTimeoutSeconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      step="1"
                      value={settings.notificationTimeoutSeconds}
                      onChange={(e) =>
                        updateSetting('notificationTimeoutSeconds', Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#181b26] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">
                      Duration before the Dynamic Island pill dismisses automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'lock' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Background Audio & Tab Lock
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Listen to background music or podcasts in one tab without it pausing when you switch away.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-100">
                      Per-Tab Background Exemption
                    </h3>
                    <p className="text-xs text-slate-400">
                      Independent per-tab control without whitelisting entire domains.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  When you lock a tab, Stop Play lets that specific video or audio stream continue
                  playing smoothly in the background. Other tabs will continue auto-pausing and
                  resuming normally.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#090b12] border border-white/[0.06] space-y-1.5">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>How to Lock a Tab</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Click the Stop Play icon in your browser toolbar, then click &quot;Keep Playing in
                      Background&quot; or press <kbd className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">L</kbd>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090b12] border border-white/[0.06] space-y-1.5">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Automatic Cleanup</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      When you close the tab, the lock is automatically released. It only applies to the
                      specific media tab you chose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'allowlist' && (
            <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Allowlisted Domains</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Videos playing on these sites will never be auto-paused (e.g. background music, white noise).
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {settings.muteList.length} configured
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. spotify.com or lofi.cafe"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  className="flex-1 bg-[#121520] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={() => handleAddDomain()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Site</span>
                </button>
              </div>

              {domainError && (
                <p className="text-[11px] text-rose-400 font-medium">{domainError}</p>
              )}

              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-slate-500 uppercase font-mono">
                  Recommended Presets:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {POPULAR_MUSIC_SITES.map((site) => {
                    const isAdded = settings.muteList.includes(site.domain);
                    return (
                      <button
                        key={site.domain}
                        disabled={isAdded}
                        onClick={() => handleAddDomain(site.domain)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isAdded
                          ? 'bg-white/[0.03] text-slate-600 border border-white/[0.04] cursor-not-allowed'
                          : 'bg-[#141722] border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20'
                          }`}
                      >
                        <Plus className="w-3 h-3 text-blue-400" />
                        <span>{site.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {settings.muteList.length > 4 && (
                <div className="relative pt-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-5" />
                  <input
                    type="text"
                    placeholder="Filter allowlist..."
                    value={domainSearch}
                    onChange={(e) => setDomainSearch(e.target.value)}
                    className="w-full bg-[#121520]/60 border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              )}

              <div className="pt-2">
                {filteredMuteList.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#090a0f] border border-white/[0.04]">
                    <Volume2 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      {settings.muteList.length === 0
                        ? 'No sites allowlisted. All video playback will be guarded.'
                        : 'No domains match your search filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredMuteList.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141722] border border-white/[0.08] text-xs text-slate-200 group hover:border-white/20 transition-all shadow-sm"
                      >
                        <span className="font-mono text-[11px]">{domain}</span>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                          title={`Remove ${domain}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'shortcuts' && (
            <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Keyboard Shortcuts & Quick Actions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control media playback and background locks without lifting your fingers from the keyboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Play / Pause Active Tab</div>
                    <div className="text-[11px] text-slate-400">Toggles video playback</div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded bg-[#181b26] border border-white/[0.1] text-xs font-mono text-slate-300 font-semibold shadow-sm">
                    Space
                  </kbd>
                </div>

                <div className="p-4 rounded-xl bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Background Lock (Keep Playing)</div>
                    <div className="text-[11px] text-slate-400">Never pause on switch</div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded bg-[#181b26] border border-white/[0.1] text-xs font-mono text-emerald-400 font-semibold shadow-sm">
                    L
                  </kbd>
                </div>

                <div className="p-4 rounded-xl bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Jump Directly to Tab</div>
                    <div className="text-[11px] text-slate-400">Focuses the video tab</div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded bg-[#181b26] border border-white/[0.1] text-xs font-mono text-slate-300 font-semibold shadow-sm">
                    Enter
                  </kbd>
                </div>

                <div className="p-4 rounded-xl bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Open Studio Settings</div>
                    <div className="text-[11px] text-slate-400">Access this preferences page</div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded bg-[#181b26] border border-white/[0.1] text-xs font-mono text-slate-300 font-semibold shadow-sm">
                    S
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'developer' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Developer & Community</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect with the creator, explore the open-source codebase, and discover more tools.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden group">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-blue-600/15 via-purple-600/15 to-transparent rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://github.com/syed-sameer-ul-hassan.png"
                      alt="Syed Sameer Ul Hassan"
                      className="w-14 h-14 rounded-2xl border border-white/20 object-cover shadow-xl shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Syed Sameer Ul Hassan</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Creator
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Full-Stack Engineer & Creator of Stop Play Chrome Extension
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://sameer.orildo.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 active:scale-95"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Visit Portfolio Site</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-2xl">
                  Built with care to solve the universal problem of forgotten background videos, noisy tabs,
                  and wasted battery. Stop Play is completely open-source, private, and lightweight.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/[0.1]">
                      <GithubIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">GitHub Open Source Repository</h3>
                      <p className="text-xs text-slate-400">View source code, star the project, or file issues</p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/syed-sameer-ul-hassan/Stop-Play"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1a1e2d] text-xs font-medium text-slate-200 border border-white/[0.08] hover:border-white/20 transition-all"
                  >
                    <Star className="w-3.5 h-3.5 text-rose-400" />
                    <span>Star Repo</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <a
                    href="https://github.com/syed-sameer-ul-hassan/Stop-Play"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#0a0c12] border border-white/[0.06] hover:border-white/20 transition-all flex items-center justify-between text-slate-300 group"
                  >
                    <span className="font-mono text-[11px]">github.com/sameershah/Stop-Play</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white" />
                  </a>

                  <a
                    href="https://github.com/syed-sameer-ul-hassan/Stop-Play/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#0a0c12] border border-white/[0.06] hover:border-white/20 transition-all flex items-center justify-between text-slate-300 group"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Report an Issue</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white" />
                  </a>

                  <div className="p-3 rounded-xl bg-[#0a0c12] border border-white/[0.06] flex items-center justify-between text-slate-400">
                    <span>License</span>
                    <span className="font-mono text-slate-200">Apache 2.0 Open Source</span>
                  </div>
                </div>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Zero-Telemetry Guarantee
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stop Play operates 100% locally within Chrome using Manifest V3 APIs. No video titles,
                  browsing history, or hostnames are ever stored externally or sent to any remote server.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'changelog' && (
            <div className="surface-card rounded-2xl p-6 border border-white/[0.07] space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Version Changelog & Roadmap</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  See what is new in each release of Stop Play.
                </p>
              </div>

              <div className="space-y-6 pt-2">
                <div className="relative pl-6 border-l-2 border-emerald-500/50 space-y-2">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-400" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">v1.2 Studio Edition</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Current
                    </span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>Full App Studio Settings redesign with dedicated sidebar and dashboard.</li>
                    <li>Per-tab &quot;Keep Playing in Background&quot; lock feature (<kbd className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">L</kbd> shortcut).</li>
                    <li>Developer portfolio and GitHub repository integration cards.</li>
                    <li>Removed cross-world extension resource preload warning.</li>
                    <li>Replaced emojis with crisp SVG vector icons across all notifications.</li>
                  </ul>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-800 space-y-2">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">v1.1 Dynamic Island & Obsidian</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>In-Page Dynamic Island floating HUD pill with isolated Shadow DOM.</li>
                    <li>Only notify first time per video to prevent notification spam.</li>
                    <li>Obsidian theme and precision acoustic radar empty state.</li>
                  </ul>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-800 space-y-2">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">v1.0 Initial Release</span>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                    <li>Chrome Manifest V3 video presence detection.</li>
                    <li>Tab-switch and app-switch notifications with Jump and Pause buttons.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export { Options };
