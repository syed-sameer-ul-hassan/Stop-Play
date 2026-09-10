import { DEFAULT_SETTINGS, ExtensionSettings, TabMediaState } from './types';

const SETTINGS_KEY = 'stop_play_settings';
const TAB_STATES_KEY = 'stop_play_tab_states';

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_SETTINGS);
      return;
    }

    const storageArea = chrome.storage.sync || chrome.storage.local;
    storageArea.get([SETTINGS_KEY], (result) => {
      if (chrome.runtime.lastError || !result[SETTINGS_KEY]) {
        resolve(DEFAULT_SETTINGS);
      } else {
        resolve({
          ...DEFAULT_SETTINGS,
          ...result[SETTINGS_KEY],
        });
      }
    });
  });
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated: ExtensionSettings = { ...current, ...settings };

  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(updated);
      return;
    }

    const storageArea = chrome.storage.sync || chrome.storage.local;
    storageArea.set({ [SETTINGS_KEY]: updated }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(updated);
      }
    });
  });
}

export async function getStoredTabStates(): Promise<Record<number, TabMediaState>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      resolve({});
      return;
    }

    chrome.storage.local.get([TAB_STATES_KEY], (result) => {
      if (chrome.runtime.lastError || !result[TAB_STATES_KEY]) {
        resolve({});
      } else {
        resolve(result[TAB_STATES_KEY]);
      }
    });
  });
}

export async function saveStoredTabStates(states: Record<number, TabMediaState>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      resolve();
      return;
    }

    chrome.storage.local.set({ [TAB_STATES_KEY]: states }, () => {
      resolve();
    });
  });
}

export function isDomainMuted(domain: string, muteList: string[]): boolean {
  if (!domain || !muteList || muteList.length === 0) return false;
  const cleanDomain = domain.toLowerCase().trim();
  return muteList.some((muted) => {
    const cleanMuted = muted.toLowerCase().trim();
    return cleanDomain === cleanMuted || cleanDomain.endsWith('.' + cleanMuted);
  });
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname;
  } catch {
    return urlStr;
  }
}
