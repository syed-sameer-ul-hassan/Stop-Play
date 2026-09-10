# Changelog

All notable changes to the **Stop Play** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-10

### Added
- **Per-Tab Background Audio Lock**: Listen to background music, podcasts, or streams in one tab without it pausing when you switch away, while other tabs continue auto-pausing normally.
- **Lock Hotkey (`L`)**: Keyboard shortcut to toggle the background lock directly from the popup deck.
- **Full App Studio Settings**: Re-architected the options page into a full desktop studio layout with a persistent left navigation sidebar and high-contrast obsidian canvas.
- **Interactive Dynamic Island HUD Simulator**: In-browser simulator in settings to test floating HUD pill animations and styling.
- **Creator Portfolio & GitHub Integration**: Quick-action cards in settings linking directly to creator portfolio (`sameershah.dev`) and open-source GitHub repository (`github.com/sameershah/Stop-Play`).
- **Path-Based Logo Resolution**: Refactored logo component to resolve `public/icons/icon.svg` dynamically via `chrome.runtime.getURL()` with `web_accessible_resources`.

### Changed
- **Removed Emojis**: Replaced all emojis across desktop notifications and UI with crisp, clean SVG vector icons.
- **Streamlined Popup Deck**: Removed unnecessary toggles, live badges, and footer clutter for a minimal, focused media deck.
- **Disabled Module Preload**: Turned off Vite's `modulePreload` in `vite.config.ts` to prevent Chrome's cross-world extension resource preload warnings.

---

## [1.1.0] - 2026-08-15

### Added
- **In-Page Dynamic Island HUD**: Sleek floating glass notification pill injected at the top of the webpage using an isolated Shadow DOM.
- **First-Time-Only Notification Filter**: Option to notify only on the first tab switch per video to eliminate repetitive alert spam.
- **Cooldown & Timeout Sliders**: User controls for alert frequency cooldown and HUD auto-dismiss timing.
- **Dual Hybrid Notification Mode**: Allows simultaneous Dynamic Island in-page HUD and native desktop notifications.

---

## [1.0.0] - 2026-07-20

### Added
- Initial release with Chrome Manifest V3 service worker.
- HTML5 video presence detection with `MutationObserver`.
- Tab-switch and OS window blur detection.
- Interactive Chrome system notifications with Jump to Tab and Pause Video actions.
- Now Playing popup deck displaying active media streams.
- Muted domain allowlist configuration.
