# Architecture & Technical Design

This document details the architectural design, lifecycle, data flow, and messaging protocol of **Stop Play**.

---

## 1. System Overview

Stop Play is built upon the **Google Chrome Manifest V3** standard. It consists of three primary execution environments:

1. **Background Service Worker (`src/background/index.ts`)**: Event-driven background script acting as the central coordinator for tab tracking, media state caching, notification dispatching, and per-tab background lock management.
2. **Content Script & Dynamic Island HUD (`src/content-script/`)**: Injected into all web pages to discover `<video>` elements, observe DOM mutations, handle playback pause/resume, and render the isolated Dynamic Island HUD pill.
3. **User Interface Surfaces (`src/popup/` & `src/options/`)**: React 18 single-page applications providing the fast popup controller and the full-featured desktop Studio Settings canvas.

```
+-------------------------------------------------------------------------+
|                                CHROME                                   |
|                                                                         |
|  +------------------+                    +---------------------------+  |
|  |   Active Webpage |                    |  Background Webpage (Tab) |  |
|  |  +------------+  |                    |  +------------+           |  |
|  |  | <video>    |  |                    |  | <video>    |           |  |
|  |  +------------+  |                    |  +------------+           |  |
|  |  | Dynamic    |  |                    |  | Dynamic    |           |  |
|  |  | Island HUD |  |                    |  | Island HUD |           |  |
|  |  +------------+  |                    |  +------------+           |  |
|  | Content Script|  |                    | Content Script            |  |
|  +--------^---------+                    +-------------^-------------+  |
|           |                                            |                |
|           +-------------------+    +-------------------+                |
|                               |    |                                    |
|                       Message |    | Message                            |
|                       Passing |    | Passing                            |
|                               v    v                                    |
|             +-----------------------------------------+                 |
|             |        Background Service Worker        |                 |
|             |    - Tab Switch / App Switch Listeners  |                 |
|             |    - Active Media Registry              |                 |
|             |    - lockedTabs (Set<number>)           |                 |
|             |    - Notification Dispatcher            |                 |
|             +--------------------^--------------------+                 |
|                                  |                                      |
|                                  | Messages                             |
|                                  v                                      |
|             +-----------------------------------------+                 |
|             |         UI Layer (React 18)             |                 |
|             |   - Popup Deck (src/popup/)             |                 |
|             |   - Studio Settings (src/options/)      |                 |
|             +-----------------------------------------+                 |
+-------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### A. Background Service Worker
- **Event Listeners**:
  - `chrome.tabs.onActivated`: Detects when the user switches browser tabs within Chrome.
  - `chrome.windows.onFocusChanged`: Detects when Chrome loses OS focus (switching to IDE, Slack, or desktop app).
  - `chrome.tabs.onRemoved`: Cleans up media states and per-tab background locks when a tab is closed.
- **Tab Lock Registry (`lockedTabs: Set<number>`)**:
  - Tracks specific tab IDs that have background lock enabled.
  - If a tab ID is present in `lockedTabs`, the service worker ignores switch-away pause triggers for that tab.

### B. Content Script & Mutation Observer
- Scans the DOM for standard HTML5 `<video>` tags.
- Uses a `MutationObserver` on `document.documentElement` to detect dynamically mounted video players (such as YouTube single-page navigation).
- Listens to native media events: `play`, `pause`, `ended`, `timeupdate`, `loadedmetadata`.
- Sends periodic `MEDIA_STATUS` payloads to the service worker to sync playhead position, video duration, and media title.

### C. Dynamic Island In-Page HUD
- Created via `customElements` or direct DOM injection using an isolated Shadow DOM (`mode: 'open'`).
- Injects a high-z-index (`2147483647`) floating glass pill at the top-center of the viewport.
- Shadow DOM boundary guarantees that the host website's CSS rules cannot leak into or distort the HUD layout, and the HUD styles cannot interfere with host page styling.

---

## 3. Message Passing Protocol

Communication across extension contexts occurs via `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`:

| Message Type | Sender | Recipient | Payload | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `MEDIA_STATUS` | Content Script | Service Worker | `{ isPlaying, title, domain, currentTime, duration, isLocked }` | Synchronizes active media state with background registry |
| `TOGGLE_TAB_LOCK` | Popup / UI | Service Worker | `{ tabId }` | Toggles the per-tab background lock for a specific tab |
| `TRIGGER_ACTION` | Popup / Notification | Service Worker | `{ action: 'pause' \| 'resume' \| 'jump', tabId }` | Executes remote playback commands |
| `PAUSE_VIDEO` | Service Worker | Content Script | `{}` | Directs content script to pause playing video |
| `RESUME_VIDEO` | Service Worker | Content Script | `{}` | Directs content script to resume playing video |
| `UPDATE_SETTINGS`| Options / Popup | Service Worker & Tabs | `{ settings: Partial<ExtensionSettings> }` | Broadcasts user configuration updates |
| `SHOW_HUD` | Service Worker | Content Script | `{ type, text, subtext, duration }` | Injects Dynamic Island HUD into tab |

---

## 4. Storage & State Persistence

- Storage is managed via `chrome.storage.local`.
- Default settings include:
  - `enabled: true`
  - `autoPauseOnSwitch: true`
  - `autoResumeOnReturn: true`
  - `notificationStyle: 'both'`
  - `muteList: ['music.apple.com', 'soundcloud.com']`
  - `cooldownSeconds: 30`
  - `notificationTimeoutSeconds: 5`
  - `notifyOncePerTab: false`
- All settings sync seamlessly across popup, content script, and settings canvas.
