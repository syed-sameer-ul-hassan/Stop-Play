import { VideoState, DEFAULT_SETTINGS, ExtensionSettings } from '../shared/types';
import { isDomainMuted } from '../shared/storage';
import { showInPageHUD } from './hud';

(function () {
  if ((window as unknown as { __STOP_PLAY_INJECTED__?: boolean }).__STOP_PLAY_INJECTED__) {
    return;
  }
  (window as unknown as { __STOP_PLAY_INJECTED__?: boolean }).__STOP_PLAY_INJECTED__ = true;

  let settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  const observedVideos = new Set<HTMLVideoElement>();
  const autoPausedVideos = new Set<HTMLVideoElement>();
  let ytAutoPaused = false;
  let isAutoPaused = false;
  let isTabLocked = false;
  let hasShownNotificationForCurrentVideo = false;
  let currentVideoUrl = window.location.href;
  let lastReportedState: VideoState | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function checkUrlChange() {
    if (window.location.href !== currentVideoUrl) {
      currentVideoUrl = window.location.href;
      hasShownNotificationForCurrentVideo = false;
    }
  }
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('yt-navigate-finish', checkUrlChange);

  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const storageArea = chrome.storage.sync || chrome.storage.local;
      storageArea.get(['stop_play_settings'], (result) => {
        if (!chrome.runtime.lastError && result.stop_play_settings) {
          settings = { ...DEFAULT_SETTINGS, ...result.stop_play_settings };
        }
      });

      chrome.storage.onChanged.addListener((changes) => {
        if (changes.stop_play_settings) {
          settings = { ...DEFAULT_SETTINGS, ...changes.stop_play_settings.newValue };
        }
      });
    }
  }
  loadSettings();

  function getFaviconUrl(): string {
    const link =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      (document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement) ||
      (document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement);

    if (link && link.href) {
      return link.href;
    }
    return `${window.location.origin}/favicon.ico`;
  }

  function getVideoThumbnail(videoEl?: HTMLVideoElement): string | undefined {
    const url = window.location.href;
    if (url.includes('youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    if (videoEl && videoEl.poster) {
      return videoEl.poster;
    }
    return undefined;
  }

  function getVideoTitle(): string {
    if (window.location.hostname.includes('youtube.com')) {
      const ytTitleElem =
        document.querySelector('ytd-watch-metadata #title h1 yt-formatted-string') ||
        document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
        document.querySelector('#container h1 yt-formatted-string');

      if (ytTitleElem && ytTitleElem.textContent?.trim()) {
        return ytTitleElem.textContent.trim();
      }
    }

    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent?.trim() && h1.textContent.trim().length < 120) {
      return h1.textContent.trim();
    }

    return document.title || window.location.hostname;
  }

  function evaluateVideoState(): VideoState {
    const videos = Array.from(document.querySelectorAll('video'));
    let activeVideo: HTMLVideoElement | null = null;

    for (const v of videos) {
      if (!v.paused && !v.ended && v.readyState > 1) {
        activeVideo = v;
        break;
      }
    }

    const isYouTube = window.location.hostname.includes('youtube.com');
    let ytIsPlaying = false;
    if (isYouTube) {
      try {
        const moviePlayer = document.getElementById('movie_player') as unknown as {
          getPlayerState?: () => number;
        };
        if (moviePlayer && typeof moviePlayer.getPlayerState === 'function') {
          ytIsPlaying = moviePlayer.getPlayerState() === 1;
        }
      } catch {}
    }

    const isPlaying = Boolean(activeVideo) || ytIsPlaying;
    const representativeVideo = activeVideo || (videos.length > 0 ? videos[0] : undefined);

    return {
      isPlaying,
      title: getVideoTitle(),
      url: window.location.href,
      domain: window.location.hostname,
      favicon: getFaviconUrl(),
      videoCount: videos.length,
      currentTime: representativeVideo?.currentTime,
      duration: representativeVideo?.duration,
      isMuted: representativeVideo?.muted,
      thumbnailUrl: getVideoThumbnail(representativeVideo),
    };
  }

  function broadcastState(immediate = false) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    const run = () => {
      const currentState = evaluateVideoState();

      if (
        lastReportedState &&
        lastReportedState.isPlaying === currentState.isPlaying &&
        lastReportedState.title === currentState.title &&
        lastReportedState.videoCount === currentState.videoCount
      ) {
        return;
      }

      lastReportedState = currentState;

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'VIDEO_STATE_CHANGED',
            payload: currentState,
          }).catch(() => {});
        }
      } catch {}
    };

    if (immediate) {
      run();
    } else {
      debounceTimer = setTimeout(run, 150);
    }
  }

  function doAutoPause(): boolean {
    if (!settings.enabled || !settings.autoPauseOnSwitch || isTabLocked) return false;
    const domain = window.location.hostname;
    if (isDomainMuted(domain, settings.muteList)) return false;

    let pausedAny = false;
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      if (!v.paused && !v.ended) {
        v.pause();
        autoPausedVideos.add(v);
        pausedAny = true;
      }
    });

    if (window.location.hostname.includes('youtube.com')) {
      try {
        const moviePlayer = document.getElementById('movie_player') as unknown as {
          getPlayerState?: () => number;
          pauseVideo?: () => void;
        };
        if (moviePlayer && typeof moviePlayer.pauseVideo === 'function') {
          if (moviePlayer.getPlayerState && moviePlayer.getPlayerState() === 1) {
            ytAutoPaused = true;
          }
          moviePlayer.pauseVideo();
          pausedAny = true;
        }
      } catch {}
    }

    if (pausedAny) {
      isAutoPaused = true;
      broadcastState(true);

      checkUrlChange();
      const shouldNotify = settings.notifyOncePerTab ? !hasShownNotificationForCurrentVideo : true;
      if (
        shouldNotify &&
        settings.notifyOnAutoPause &&
        (settings.notificationStyle === 'banner' || settings.notificationStyle === 'both')
      ) {
        hasShownNotificationForCurrentVideo = true;
        showInPageHUD({
          type: 'paused',
          title: getVideoTitle(),
          domain: window.location.hostname,
          onPlayClick: () => {
            doAutoResume();
          },
        });
      }
    }
    return pausedAny;
  }

  function doAutoResume(): boolean {
    if (!settings.enabled || !settings.autoResumeOnReturn) return false;
    if (!isAutoPaused && autoPausedVideos.size === 0 && !ytAutoPaused) return false;

    let resumedAny = false;

    if (autoPausedVideos.size > 0) {
      autoPausedVideos.forEach((v) => {
        v.play().catch(() => {});
        resumedAny = true;
      });
      autoPausedVideos.clear();
    } else {
      const videos = document.querySelectorAll('video');
      if (videos.length > 0 && videos[0].paused) {
        videos[0].play().catch(() => {});
        resumedAny = true;
      }
    }

    if (window.location.hostname.includes('youtube.com') && ytAutoPaused) {
      try {
        const moviePlayer = document.getElementById('movie_player') as unknown as {
          playVideo?: () => void;
        };
        if (moviePlayer && typeof moviePlayer.playVideo === 'function' && ytAutoPaused) {
          moviePlayer.playVideo();
          resumedAny = true;
        }
      } catch {}
      ytAutoPaused = false;
    }

    isAutoPaused = false;
    if (resumedAny) {
      broadcastState(true);
    }
    return resumedAny;
  }

  function attachVideoListeners(video: HTMLVideoElement) {
    if (observedVideos.has(video)) return;
    observedVideos.add(video);

    const onPlay = () => {
      if (document.visibilityState === 'visible') {
        isAutoPaused = false;
        autoPausedVideos.delete(video);
      }
      broadcastState(true);
    };
    const onPause = () => broadcastState(true);
    const onEnded = () => broadcastState(true);
    const onVolumeChange = () => broadcastState(false);
    const onEmptied = () => broadcastState(true);

    video.addEventListener('play', onPlay, { passive: true });
    video.addEventListener('playing', onPlay, { passive: true });
    video.addEventListener('pause', onPause, { passive: true });
    video.addEventListener('ended', onEnded, { passive: true });
    video.addEventListener('volumechange', onVolumeChange, { passive: true });
    video.addEventListener('emptied', onEmptied, { passive: true });
  }

  function scanVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => attachVideoListeners(video));
  }
  scanVideos();
  broadcastState(true);

  const observer = new MutationObserver((mutations) => {
    let foundNew = false;
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLVideoElement) {
          attachVideoListeners(node);
          foundNew = true;
        } else if (node instanceof HTMLElement) {
          const innerVideos = node.querySelectorAll('video');
          if (innerVideos.length > 0) {
            innerVideos.forEach((v) => attachVideoListeners(v));
            foundNew = true;
          }
        }
      }
    }
    if (foundNew) {
      broadcastState();
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!isTabLocked) {
        doAutoPause();
      }
    } else {
      if (!isTabLocked) {
        doAutoResume();
      }
    }
    broadcastState();
  });

  window.addEventListener('blur', () => {
    if ((settings.appSwitchAlerts || settings.autoPauseOnSwitch) && !isTabLocked) {
      doAutoPause();
    }
  });

  window.addEventListener('focus', () => {
    if (settings.autoResumeOnReturn && !isTabLocked) {
      doAutoResume();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === 'SET_TAB_LOCKED') {
      isTabLocked = Boolean(message.locked);
      showInPageHUD({
        type: 'info',
        title: isTabLocked ? 'Keep Playing Locked' : 'Auto-Pause Active',
        domain: isTabLocked ? 'Never pauses in background' : 'Auto-pauses when switching away',
      });
      sendResponse({ success: true, isTabLocked });
      return true;
    }

    if (message.type === 'AUTO_PAUSE' || message.type === 'PAUSE_VIDEO') {
      const paused = doAutoPause();
      sendResponse({ success: true, paused });
      return true;
    }

    if (message.type === 'AUTO_RESUME' || message.type === 'PLAY_VIDEO') {
      isAutoPaused = true;
      const resumed = doAutoResume();
      sendResponse({ success: true, resumed });
      return true;
    }

    if (message.type === 'QUERY_MEDIA_STATE') {
      sendResponse(evaluateVideoState());
      return true;
    }
  });
})();
