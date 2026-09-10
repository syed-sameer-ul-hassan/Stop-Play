export interface VideoState {
  isPlaying: boolean;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  videoCount: number;
  currentTime?: number;
  duration?: number;
  isMuted?: boolean;
  thumbnailUrl?: string;
}

export interface TabMediaState {
  tabId: number;
  windowId: number;
  state: VideoState;
  lastUpdated: number;
  lastNotified: number;
  wasAutoPaused?: boolean;
  hasNotified?: boolean;
  isLocked?: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  tabSwitchAlerts: boolean;
  appSwitchAlerts: boolean;
  autoPauseOnSwitch: boolean;
  autoResumeOnReturn: boolean;
  notifyOncePerTab: boolean;
  cooldownSeconds: number;
  notificationTimeoutSeconds: number;
  soundEnabled: boolean;
  notifyOnAutoPause: boolean;
  notificationStyle: 'banner' | 'system' | 'both';
  muteList: string[];
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  tabSwitchAlerts: true,
  appSwitchAlerts: true,
  autoPauseOnSwitch: true,
  autoResumeOnReturn: true,
  notifyOncePerTab: true,
  cooldownSeconds: 45,
  notificationTimeoutSeconds: 5,
  soundEnabled: false,
  notifyOnAutoPause: true,
  notificationStyle: 'both',
  muteList: ['open.spotify.com', 'music.apple.com', 'soundcloud.com']
};

export type RuntimeMessage =
  | { type: 'VIDEO_STATE_CHANGED'; payload: VideoState }
  | { type: 'GET_ALL_PLAYING_TABS' }
  | { type: 'PAUSE_TAB_VIDEO'; tabId: number }
  | { type: 'RESUME_TAB_VIDEO'; tabId: number }
  | { type: 'JUMP_TO_TAB'; tabId: number }
  | { type: 'TOGGLE_MUTE_DOMAIN'; domain: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ExtensionSettings> }
  | { type: 'GET_SETTINGS' }
  | { type: 'TEST_NOTIFICATION' }
  | { type: 'PAUSE_VIDEO' }
  | { type: 'PLAY_VIDEO' }
  | { type: 'AUTO_PAUSE' }
  | { type: 'AUTO_RESUME' }
  | { type: 'QUERY_MEDIA_STATE' }
  | { type: 'TOGGLE_TAB_LOCK'; tabId: number }
  | { type: 'SET_TAB_LOCKED'; locked: boolean }
  | { type: 'GET_LOCKED_TABS' };
