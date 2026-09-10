"use strict";
(() => {
  // src/shared/types.ts
  var DEFAULT_SETTINGS = {
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
    notificationStyle: "both",
    muteList: ["open.spotify.com", "music.apple.com", "soundcloud.com"]
  };

  // src/shared/storage.ts
  function isDomainMuted(domain, muteList) {
    if (!domain || !muteList || muteList.length === 0) return false;
    const cleanDomain = domain.toLowerCase().trim();
    return muteList.some((muted) => {
      const cleanMuted = muted.toLowerCase().trim();
      return cleanDomain === cleanMuted || cleanDomain.endsWith("." + cleanMuted);
    });
  }

  // src/content-script/hud.ts
  var hudHost = null;
  var shadowRoot = null;
  var dismissTimer = null;
  function showInPageHUD(options) {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    if (!hudHost) {
      hudHost = document.createElement("div");
      hudHost.id = "stop-play-hud-root";
      hudHost.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 0;
      overflow: visible;
      z-index: 2147483647;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
      (document.documentElement || document.body).appendChild(hudHost);
      shadowRoot = hudHost.attachShadow({ mode: "open" });
    }
    if (!shadowRoot) return;
    const isPaused = options.type === "paused";
    const isResumed = options.type === "resumed";
    const accentColor = isPaused ? "#f43f5e" : isResumed ? "#10b981" : "#3b82f6";
    const glowShadow = isPaused ? "rgba(244, 63, 94, 0.35)" : isResumed ? "rgba(16, 185, 129, 0.35)" : "rgba(59, 130, 246, 0.35)";
    const iconSvg = isPaused ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>` : isResumed ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>` : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    const statusLabel = isPaused ? "Auto-Paused" : isResumed ? "Resumed Playback" : "Stop Play Alert";
    const hintText = isPaused ? "Will auto-resume when you return" : "Playing right where you left off";
    shadowRoot.innerHTML = `
    <style>
      .hud-pill {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%) translateY(-60px) scale(0.92);
        opacity: 0;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(11, 15, 25, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 20px 0 ${glowShadow};
        border-radius: 9999px;
        padding: 8px 14px 8px 10px;
        color: #f1f5f9;
        font-size: 13px;
        line-height: 1.3;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        max-width: 90vw;
        box-sizing: border-box;
      }
      .hud-pill.show {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      .hud-pill.hide {
        transform: translateX(-50%) translateY(-60px) scale(0.92);
        opacity: 0;
      }
      .hud-icon-badge {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${accentColor}22;
        border: 1.5px solid ${accentColor};
        color: ${accentColor};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .hud-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .hud-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hud-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: ${accentColor};
      }
      .hud-dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
      }
      .hud-domain {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
      }
      .hud-title {
        font-size: 12px;
        font-weight: 600;
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 240px;
      }
      .hud-hint {
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
      }
      .hud-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 4px;
      }
      .hud-btn-action {
        background: ${accentColor}20;
        border: 1px solid ${accentColor}50;
        color: ${accentColor};
        border-radius: 9999px;
        padding: 5px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }
      .hud-btn-action:hover {
        background: ${accentColor}35;
        border-color: ${accentColor};
        color: #fff;
        transform: scale(1.03);
      }
      .hud-btn-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      .hud-btn-close:hover {
        color: #e2e8f0;
      }
    </style>

    <div id="stop-play-pill" class="hud-pill">
      <div class="hud-icon-badge">
        ${iconSvg}
      </div>
      <div class="hud-content">
        <div class="hud-header">
          <span class="hud-badge">${statusLabel}</span>
          ${options.domain ? `<span class="hud-dot"></span><span class="hud-domain">${options.domain}</span>` : ""}
        </div>
        <div class="hud-title">${options.title || "HTML5 Video"}</div>
        <div class="hud-hint">${hintText}</div>
      </div>

      <div class="hud-actions">
        ${isPaused && options.onPlayClick ? `<button id="hud-resume-btn" class="hud-btn-action">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Play</span>
              </button>` : ""}
        <button id="hud-close-btn" class="hud-btn-close" title="Dismiss">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `;
    const pill = shadowRoot.getElementById("stop-play-pill");
    if (!pill) return;
    requestAnimationFrame(() => {
      pill.classList.add("show");
    });
    function dismiss() {
      if (!pill) return;
      pill.classList.remove("show");
      pill.classList.add("hide");
      setTimeout(() => {
        if (shadowRoot) shadowRoot.innerHTML = "";
      }, 400);
    }
    const resumeBtn = shadowRoot.getElementById("hud-resume-btn");
    if (resumeBtn && options.onPlayClick) {
      resumeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        options.onPlayClick?.();
        showInPageHUD({
          type: "resumed",
          title: options.title,
          domain: options.domain
        });
      });
    }
    const closeBtn = shadowRoot.getElementById("hud-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dismiss();
      });
    }
    const duration = isResumed ? 2200 : 3800;
    dismissTimer = setTimeout(dismiss, duration);
    pill.addEventListener("mouseenter", () => {
      if (dismissTimer) clearTimeout(dismissTimer);
    });
    pill.addEventListener("mouseleave", () => {
      dismissTimer = setTimeout(dismiss, 2e3);
    });
  }

  // src/content-script/index.ts
  (function() {
    if (window.__STOP_PLAY_INJECTED__) {
      return;
    }
    window.__STOP_PLAY_INJECTED__ = true;
    let settings = { ...DEFAULT_SETTINGS };
    const observedVideos = /* @__PURE__ */ new Set();
    const autoPausedVideos = /* @__PURE__ */ new Set();
    let ytAutoPaused = false;
    let isAutoPaused = false;
    let isTabLocked = false;
    let hasShownNotificationForCurrentVideo = false;
    let currentVideoUrl = window.location.href;
    let lastReportedState = null;
    let debounceTimer = null;
    function checkUrlChange() {
      if (window.location.href !== currentVideoUrl) {
        currentVideoUrl = window.location.href;
        hasShownNotificationForCurrentVideo = false;
      }
    }
    window.addEventListener("popstate", checkUrlChange);
    window.addEventListener("yt-navigate-finish", checkUrlChange);
    function loadSettings() {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const storageArea = chrome.storage.sync || chrome.storage.local;
        storageArea.get(["stop_play_settings"], (result) => {
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
    function getFaviconUrl() {
      const link = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel='shortcut icon']") || document.querySelector("link[rel='apple-touch-icon']");
      if (link && link.href) {
        return link.href;
      }
      return `${window.location.origin}/favicon.ico`;
    }
    function getVideoThumbnail(videoEl) {
      const url = window.location.href;
      if (url.includes("youtube.com/watch")) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match && match[1]) {
          return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
      }
      if (videoEl && videoEl.poster) {
        return videoEl.poster;
      }
      return void 0;
    }
    function getVideoTitle() {
      if (window.location.hostname.includes("youtube.com")) {
        const ytTitleElem = document.querySelector("ytd-watch-metadata #title h1 yt-formatted-string") || document.querySelector("h1.ytd-video-primary-info-renderer yt-formatted-string") || document.querySelector("#container h1 yt-formatted-string");
        if (ytTitleElem && ytTitleElem.textContent?.trim()) {
          return ytTitleElem.textContent.trim();
        }
      }
      const h1 = document.querySelector("h1");
      if (h1 && h1.textContent?.trim() && h1.textContent.trim().length < 120) {
        return h1.textContent.trim();
      }
      return document.title || window.location.hostname;
    }
    function evaluateVideoState() {
      const videos = Array.from(document.querySelectorAll("video"));
      let activeVideo = null;
      for (const v of videos) {
        if (!v.paused && !v.ended && v.readyState > 1) {
          activeVideo = v;
          break;
        }
      }
      const isYouTube = window.location.hostname.includes("youtube.com");
      let ytIsPlaying = false;
      if (isYouTube) {
        try {
          const moviePlayer = document.getElementById("movie_player");
          if (moviePlayer && typeof moviePlayer.getPlayerState === "function") {
            ytIsPlaying = moviePlayer.getPlayerState() === 1;
          }
        } catch {
        }
      }
      const isPlaying = Boolean(activeVideo) || ytIsPlaying;
      const representativeVideo = activeVideo || (videos.length > 0 ? videos[0] : void 0);
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
        thumbnailUrl: getVideoThumbnail(representativeVideo)
      };
    }
    function broadcastState(immediate = false) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      const run = () => {
        const currentState = evaluateVideoState();
        if (lastReportedState && lastReportedState.isPlaying === currentState.isPlaying && lastReportedState.title === currentState.title && lastReportedState.videoCount === currentState.videoCount) {
          return;
        }
        lastReportedState = currentState;
        try {
          if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: "VIDEO_STATE_CHANGED",
              payload: currentState
            }).catch(() => {
            });
          }
        } catch {
        }
      };
      if (immediate) {
        run();
      } else {
        debounceTimer = setTimeout(run, 150);
      }
    }
    function doAutoPause() {
      if (!settings.enabled || !settings.autoPauseOnSwitch || isTabLocked) return false;
      const domain = window.location.hostname;
      if (isDomainMuted(domain, settings.muteList)) return false;
      let pausedAny = false;
      const videos = document.querySelectorAll("video");
      videos.forEach((v) => {
        if (!v.paused && !v.ended) {
          v.pause();
          autoPausedVideos.add(v);
          pausedAny = true;
        }
      });
      if (window.location.hostname.includes("youtube.com")) {
        try {
          const moviePlayer = document.getElementById("movie_player");
          if (moviePlayer && typeof moviePlayer.pauseVideo === "function") {
            if (moviePlayer.getPlayerState && moviePlayer.getPlayerState() === 1) {
              ytAutoPaused = true;
            }
            moviePlayer.pauseVideo();
            pausedAny = true;
          }
        } catch {
        }
      }
      if (pausedAny) {
        isAutoPaused = true;
        broadcastState(true);
        checkUrlChange();
        const shouldNotify = settings.notifyOncePerTab ? !hasShownNotificationForCurrentVideo : true;
        if (shouldNotify && settings.notifyOnAutoPause && (settings.notificationStyle === "banner" || settings.notificationStyle === "both")) {
          hasShownNotificationForCurrentVideo = true;
          showInPageHUD({
            type: "paused",
            title: getVideoTitle(),
            domain: window.location.hostname,
            onPlayClick: () => {
              doAutoResume();
            }
          });
        }
      }
      return pausedAny;
    }
    function doAutoResume() {
      if (!settings.enabled || !settings.autoResumeOnReturn) return false;
      if (!isAutoPaused && autoPausedVideos.size === 0 && !ytAutoPaused) return false;
      let resumedAny = false;
      if (autoPausedVideos.size > 0) {
        autoPausedVideos.forEach((v) => {
          v.play().catch(() => {
          });
          resumedAny = true;
        });
        autoPausedVideos.clear();
      } else {
        const videos = document.querySelectorAll("video");
        if (videos.length > 0 && videos[0].paused) {
          videos[0].play().catch(() => {
          });
          resumedAny = true;
        }
      }
      if (window.location.hostname.includes("youtube.com") && ytAutoPaused) {
        try {
          const moviePlayer = document.getElementById("movie_player");
          if (moviePlayer && typeof moviePlayer.playVideo === "function" && ytAutoPaused) {
            moviePlayer.playVideo();
            resumedAny = true;
          }
        } catch {
        }
        ytAutoPaused = false;
      }
      isAutoPaused = false;
      if (resumedAny) {
        broadcastState(true);
      }
      return resumedAny;
    }
    function attachVideoListeners(video) {
      if (observedVideos.has(video)) return;
      observedVideos.add(video);
      const onPlay = () => {
        if (document.visibilityState === "visible") {
          isAutoPaused = false;
          autoPausedVideos.delete(video);
        }
        broadcastState(true);
      };
      const onPause = () => broadcastState(true);
      const onEnded = () => broadcastState(true);
      const onVolumeChange = () => broadcastState(false);
      const onEmptied = () => broadcastState(true);
      video.addEventListener("play", onPlay, { passive: true });
      video.addEventListener("playing", onPlay, { passive: true });
      video.addEventListener("pause", onPause, { passive: true });
      video.addEventListener("ended", onEnded, { passive: true });
      video.addEventListener("volumechange", onVolumeChange, { passive: true });
      video.addEventListener("emptied", onEmptied, { passive: true });
    }
    function scanVideos() {
      const videos = document.querySelectorAll("video");
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
            const innerVideos = node.querySelectorAll("video");
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
      subtree: true
    });
    document.addEventListener("visibilitychange", () => {
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
    window.addEventListener("blur", () => {
      if ((settings.appSwitchAlerts || settings.autoPauseOnSwitch) && !isTabLocked) {
        doAutoPause();
      }
    });
    window.addEventListener("focus", () => {
      if (settings.autoResumeOnReturn && !isTabLocked) {
        doAutoResume();
      }
    });
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || !message.type) return;
      if (message.type === "SET_TAB_LOCKED") {
        isTabLocked = Boolean(message.locked);
        showInPageHUD({
          type: "info",
          title: isTabLocked ? "Keep Playing Locked" : "Auto-Pause Active",
          domain: isTabLocked ? "Never pauses in background" : "Auto-pauses when switching away"
        });
        sendResponse({ success: true, isTabLocked });
        return true;
      }
      if (message.type === "AUTO_PAUSE" || message.type === "PAUSE_VIDEO") {
        const paused = doAutoPause();
        sendResponse({ success: true, paused });
        return true;
      }
      if (message.type === "AUTO_RESUME" || message.type === "PLAY_VIDEO") {
        isAutoPaused = true;
        const resumed = doAutoResume();
        sendResponse({ success: true, resumed });
        return true;
      }
      if (message.type === "QUERY_MEDIA_STATE") {
        sendResponse(evaluateVideoState());
        return true;
      }
    });
  })();
})();
