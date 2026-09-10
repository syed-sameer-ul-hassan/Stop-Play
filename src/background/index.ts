import { extractDomain, getSettings, getStoredTabStates, isDomainMuted, saveSettings, saveStoredTabStates } from '../shared/storage';
import { TabMediaState, VideoState } from '../shared/types';

let tabMediaMap: Map<number, TabMediaState> = new Map();
const lockedTabs = new Set<number>();
let currentActiveTabId: number | null = null;
let currentWindowId: number | null = null;
let notificationTabMap: Map<string, number> = new Map();

async function initializeState() {
  try {
    const stored = await getStoredTabStates();
    tabMediaMap = new Map(
      Object.entries(stored).map(([id, state]) => [Number(id), state])
    );

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      currentActiveTabId = activeTab.id;
      currentWindowId = activeTab.windowId;
    }

    updateBadge();
  } catch (err) {
    console.error('[StopPlay] Initialization error:', err);
  }
}

initializeState();

chrome.alarms.create('stopPlayHeartbeat', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'stopPlayHeartbeat') {
    updateBadge();
  }
});

async function persistStates() {
  const obj: Record<number, TabMediaState> = {};
  tabMediaMap.forEach((val, key) => {
    obj[key] = val;
  });
  await saveStoredTabStates(obj);
}

async function updateBadge() {
  try {
    const settings = await getSettings();
    if (!settings.enabled) {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#6B7280' });
      return;
    }

    let backgroundPlayingCount = 0;
    tabMediaMap.forEach((entry, tabId) => {
      if (entry.state.isPlaying) {
        if (tabId !== currentActiveTabId || currentWindowId === chrome.windows.WINDOW_ID_NONE) {
          backgroundPlayingCount++;
        }
      }
    });

    if (backgroundPlayingCount > 0) {
      chrome.action.setBadgeText({ text: backgroundPlayingCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch {}
}

async function handleBackgroundMediaAlert(tabId: number, trigger: 'tab_switch' | 'app_switch') {
  const entry = tabMediaMap.get(tabId);
  if (!entry || !entry.state || !entry.state.isPlaying) return;

  if (lockedTabs.has(tabId)) {
    return;
  }

  const settings = await getSettings();
  if (!settings.enabled) return;

  if (trigger === 'tab_switch' && !settings.tabSwitchAlerts) return;
  if (trigger === 'app_switch' && !settings.appSwitchAlerts) return;

  const domain = entry.state.domain || extractDomain(entry.state.url);
  if (isDomainMuted(domain, settings.muteList)) {
    return;
  }

  if (settings.autoPauseOnSwitch) {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'AUTO_PAUSE' });
      entry.wasAutoPaused = true;
      entry.state.isPlaying = false;
      tabMediaMap.set(tabId, entry);
      persistStates();
      updateBadge();
    } catch {}
  }

  if (settings.notifyOncePerTab && entry.hasNotified) {
    return;
  }

  const now = Date.now();
  const cooldownMs = (settings.cooldownSeconds || 45) * 1000;
  if (entry.lastNotified && now - entry.lastNotified < cooldownMs) {
    return;
  }

  entry.hasNotified = true;
  entry.lastNotified = now;
  tabMediaMap.set(tabId, entry);
  persistStates();

  if (settings.notificationStyle === 'banner') {
    return;
  }

  const notifId = `stop-play-${tabId}-${now}`;
  notificationTabMap.set(notifId, tabId);

  const notificationTitle = settings.autoPauseOnSwitch
    ? 'Video Auto-Paused'
    : 'Video Playing in Background';

  const notificationMessage = `${entry.state.title || 'Video'} • ${domain}`;
  const contextMessage = settings.autoPauseOnSwitch
    ? 'Auto-resumes when you return'
    : 'Stop Play Guardian';

  chrome.notifications.create(
    notifId,
    {
      type: 'basic',
      iconUrl: entry.state.favicon || chrome.runtime.getURL('icons/icon128.png'),
      title: notificationTitle,
      message: notificationMessage,
      contextMessage,
      priority: 2,
      requireInteraction: false,
      silent: !settings.soundEnabled,
      buttons: [
        { title: settings.autoPauseOnSwitch ? 'Resume Video' : 'Pause Video' },
        { title: 'Jump to Tab' }
      ]
    },
    (createdId) => {
      if (chrome.runtime.lastError) {
        chrome.notifications.create(notifId, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: notificationTitle,
          message: notificationMessage,
          priority: 2,
        });
      }

      const timeout = (settings.notificationTimeoutSeconds || 5) * 1000;
      setTimeout(() => {
        chrome.notifications.clear(createdId || notifId);
      }, timeout);
    }
  );
}

chrome.notifications.onButtonClicked.addListener(async (notifId, buttonIndex) => {
  const tabId = notificationTabMap.get(notifId);
  if (!tabId) return;

  const entry = tabMediaMap.get(tabId);
  const settings = await getSettings();

  if (buttonIndex === 0) {
    try {
      if (settings.autoPauseOnSwitch && entry && !entry.state.isPlaying) {
        chrome.tabs.sendMessage(tabId, { type: 'AUTO_RESUME' });
        entry.wasAutoPaused = false;
        entry.state.isPlaying = true;
      } else {
        chrome.tabs.sendMessage(tabId, { type: 'PAUSE_VIDEO' });
      }
    } catch {}
  } else if (buttonIndex === 1) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab) {
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch (err) {
      console.warn('[StopPlay] Could not focus tab:', err);
    }
  }

  chrome.notifications.clear(notifId);
});

chrome.notifications.onClicked.addListener(async (notifId) => {
  const tabId = notificationTabMap.get(notifId);
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab) {
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch {}
  }
  chrome.notifications.clear(notifId);
});

chrome.notifications.onClosed.addListener((notifId) => {
  notificationTabMap.delete(notifId);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const previousTabId = currentActiveTabId;
  currentActiveTabId = activeInfo.tabId;
  currentWindowId = activeInfo.windowId;

  if (previousTabId && previousTabId !== activeInfo.tabId) {
    await handleBackgroundMediaAlert(previousTabId, 'tab_switch');
  }

  const settings = await getSettings();
  if (settings.enabled && settings.autoResumeOnReturn) {
    try {
      chrome.tabs.sendMessage(activeInfo.tabId, { type: 'AUTO_RESUME' });
      const currentEntry = tabMediaMap.get(activeInfo.tabId);
      if (currentEntry) {
        currentEntry.wasAutoPaused = false;
        currentEntry.state.isPlaying = true;
        tabMediaMap.set(activeInfo.tabId, currentEntry);
        persistStates();
      }
    } catch {}
  }

  updateBadge();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  currentWindowId = windowId;

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (currentActiveTabId) {
      await handleBackgroundMediaAlert(currentActiveTabId, 'app_switch');
    }
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab && tab.id) {
      currentActiveTabId = tab.id;

      const settings = await getSettings();
      if (settings.enabled && settings.autoResumeOnReturn) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTO_RESUME' });
          const currentEntry = tabMediaMap.get(tab.id);
          if (currentEntry) {
            currentEntry.wasAutoPaused = false;
            currentEntry.state.isPlaying = true;
            tabMediaMap.set(tab.id, currentEntry);
            persistStates();
          }
        } catch {}
      }
    }
  }

  updateBadge();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabMediaMap.delete(tabId);
  lockedTabs.delete(tabId);
  persistStates();
  updateBadge();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const entry = tabMediaMap.get(tabId);
  if (changeInfo.url && entry) {
    entry.hasNotified = false;
  }
  if (changeInfo.status === 'loading') {
    if (entry) {
      entry.state.isPlaying = false;
      entry.hasNotified = false;
      updateBadge();
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'VIDEO_STATE_CHANGED') {
    const tabId = sender.tab?.id;
    const windowId = sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;

    if (tabId) {
      const payload: VideoState = message.payload;
      const existing = tabMediaMap.get(tabId);

      tabMediaMap.set(tabId, {
        tabId,
        windowId,
        state: payload,
        lastUpdated: Date.now(),
        lastNotified: existing?.lastNotified || 0,
      });

      persistStates();
      updateBadge();
    }
    sendResponse({ received: true });
    return true;
  }

  if (message.type === 'GET_ALL_PLAYING_TABS') {
    const playingList: Array<{
      tabId: number;
      windowId: number;
      state: VideoState;
      isCurrentTab: boolean;
      isLocked: boolean;
    }> = [];
    tabMediaMap.forEach((entry, tabId) => {
      if (entry.state && entry.state.isPlaying) {
        playingList.push({
          tabId,
          windowId: entry.windowId,
          state: entry.state,
          isCurrentTab: tabId === currentActiveTabId && currentWindowId !== chrome.windows.WINDOW_ID_NONE,
          isLocked: lockedTabs.has(tabId),
        });
      }
    });

    sendResponse({
      playingTabs: playingList,
      currentActiveTabId,
      lockedTabIds: Array.from(lockedTabs),
    });
    return true;
  }

  if (message.type === 'TOGGLE_TAB_LOCK') {
    const tabId = message.tabId;
    if (tabId) {
      if (lockedTabs.has(tabId)) {
        lockedTabs.delete(tabId);
      } else {
        lockedTabs.add(tabId);
      }
      const isLocked = lockedTabs.has(tabId);

      chrome.tabs.sendMessage(tabId, { type: 'SET_TAB_LOCKED', locked: isLocked }).catch(() => {});

      const entry = tabMediaMap.get(tabId);
      if (entry) {
        entry.isLocked = isLocked;
      }
      persistStates();
      sendResponse({ success: true, isLocked });
      return true;
    }
  }

  if (message.type === 'PAUSE_TAB_VIDEO') {
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'PAUSE_VIDEO' }, () => {
        const entry = tabMediaMap.get(tabId);
        if (entry) {
          entry.state.isPlaying = false;
          updateBadge();
        }
        sendResponse({ success: true });
      });
      return true;
    }
  }

  if (message.type === 'RESUME_TAB_VIDEO') {
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'PLAY_VIDEO' }, () => {
        const entry = tabMediaMap.get(tabId);
        if (entry) {
          entry.state.isPlaying = true;
          updateBadge();
        }
        sendResponse({ success: true });
      });
      return true;
    }
  }

  if (message.type === 'JUMP_TO_TAB') {
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs.get(tabId, (tab) => {
        if (tab) {
          chrome.tabs.update(tabId, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
          sendResponse({ success: true });
        }
      });
      return true;
    }
  }

  if (message.type === 'TOGGLE_MUTE_DOMAIN') {
    const domain = message.domain;
    if (domain) {
      getSettings().then((settings) => {
        const index = settings.muteList.indexOf(domain);
        let updatedList: string[];
        if (index >= 0) {
          updatedList = settings.muteList.filter((d) => d !== domain);
        } else {
          updatedList = [...settings.muteList, domain];
        }
        saveSettings({ muteList: updatedList }).then(() => {
          sendResponse({ success: true, muteList: updatedList });
        });
      });
      return true;
    }
  }

  if (message.type === 'TEST_NOTIFICATION') {
    const testId = `stop-play-test-${Date.now()}`;
    chrome.notifications.create(testId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Video Auto-Paused',
      message: 'Sample Video • youtube.com',
      contextMessage: 'Auto-resumes when you return',
      priority: 2,
      buttons: [
        { title: 'Resume Video' },
        { title: 'Jump to Tab' }
      ]
    }, () => {
      setTimeout(() => chrome.notifications.clear(testId), 6000);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'AUTO_PAUSE',
        }).catch(() => {});
      }
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    saveSettings(message.settings).then((updated) => {
      updateBadge();
      sendResponse({ success: true, settings: updated });
    });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then((settings) => {
      sendResponse({ settings });
    });
    return true;
  }
});
