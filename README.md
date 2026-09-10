<div align="center">
  <img src="public/icons/icon.svg" alt="Stop Play Logo" width="84" height="84" />
  <h1>Stop Play</h1>
  <p><strong>Intelligent Video Guardian & Background Audio Controller for Google Chrome</strong></p>

  <p>
    <a href="https://github.com/syed-sameer-ul-hassan/Stop-Play/releases"><img src="https://img.shields.io/badge/version-1.2.0-blue.svg?style=flat-square" alt="Version 1.2.0" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-emerald.svg?style=flat-square" alt="Apache 2.0 License" /></a>
    <img src="https://img.shields.io/badge/manifest-v3-purple.svg?style=flat-square" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/react-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black" alt="React 18" />
    <a href="https://sameer.orildo.dev"><img src="https://img.shields.io/badge/creator-Syed%20Sameer%20Ul%20Hassan-rose.svg?style=flat-square" alt="Creator Syed Sameer Ul Hassan" /></a>
  </p>
</div>

---

## Overview

**Stop Play** is a lightweight, open-source Google Chrome extension (Manifest V3) that monitors video and audio playback across your browser. When you switch away from a tab or switch from Chrome to an external desktop app (such as VS Code, Slack, or Zoom), Stop Play automatically pauses background media to save battery, save bandwidth, and stop unwanted distractions.

When you return, it seamlessly auto-resumes playback right where you paused. Need background music or a podcast to keep playing while you work? Simply lock that single tab with **Keep Playing in Background** (<kbd>L</kbd>), and Stop Play exempts it while continuing to protect all your other tabs!

---

## Key Features

### Per-Tab Background Lock (Tab Exemption)
- Listen to background music, podcasts, or study streams in one tab without it pausing when you switch away.
- Toggle per-tab lock with 1-click in the popup deck or by pressing <kbd>L</kbd>.
- Independent control: only the locked tab continues playing; other tabs continue auto-pausing and auto-resuming normally.
- Automatically cleaned up when you close the tab.

### In-Page Dynamic Island HUD
- Floating glass notification pill injected at the top-center of the viewport.
- Encapsulated inside an isolated **Shadow DOM** to prevent CSS conflicts with host websites.
- Animated indicator displaying paused/resumed status and tab switch events.

### Full App Studio Settings Canvas
- Standalone desktop settings studio with high-contrast obsidian aesthetic and left navigation sidebar.
- **Playback & Triggers**: Configure instant auto-pause on switch, auto-resume on return, and external application focus triggers.
- **Alerts & HUD**: Choose between Dynamic Island, Native OS notifications, or Dual Hybrid mode.
- **Live Simulator**: Test the in-browser Dynamic Island HUD animations interactively.
- **Muted Allowlist**: Domain allowlist with 1-click presets (Spotify, Apple Music, SoundCloud, YouTube Music, Twitch, Netflix).
- **Zero-Telemetry Guarantee**: 100% local processing; zero data sent to external servers.

### Keyboard-First Workflow
- Complete media control without touching your mouse:
  - <kbd>Space</kbd>: Toggle Play / Pause on active media.
  - <kbd>L</kbd>: Toggle Background Lock (Keep Playing).
  - <kbd>Enter</kbd>: Jump directly to the tab playing media.
  - <kbd>S</kbd>: Open Studio Settings canvas.

---

## Quick Start & Installation

### Load Directly into Chrome

1. Clone or download this repository:
   ```bash
   git clone https://github.com/sameershah/Stop-Play.git
   cd Stop-Play
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load the extension:
   - Open Google Chrome and go to `chrome://extensions`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked**.
   - Select either the root directory or the `dist/` directory.
   - The **Stop Play** icon is now active in your extensions toolbar!

---

## Interactive Playground

Test all features right out of the box using the included `demo.html` test suite:

1. Open `demo.html` in Google Chrome (e.g., drag and drop into Chrome or serve locally).
2. Click **Play Video**.
3. Switch tabs (`Ctrl+T` / `Cmd+T`) or switch to an external app to see Stop Play auto-pause and display the in-page Dynamic Island HUD.
4. Switch back to watch the video resume automatically.
5. Click **"Keep Playing in Background"** in the popup to test per-tab lock exemption.

---

## Project Architecture

```
Stop-Play/
├── .github/                  # Issue templates & PR guidelines
├── docs/
│   └── ARCHITECTURE.md       # Deep technical architecture design document
├── public/icons/             # Vector & raster extension icons
├── src/
│   ├── background/           # Manifest V3 service worker
│   │   └── index.ts          # Tab activation, window blur & lock state registry
│   ├── content-script/       # Video element observer & in-page HUD
│   │   ├── index.ts          # DOM MutationObserver & media controller
│   │   └── hud.ts            # Shadow DOM Dynamic Island component
│   ├── popup/                # Fast toolbar popup React deck
│   │   ├── Popup.tsx
│   │   └── main.tsx
│   ├── options/              # Full Studio Settings desktop application
│   │   ├── Options.tsx
│   │   └── main.tsx
│   └── shared/               # Storage helpers, types, and defaults
│       ├── storage.ts
│       ├── types.ts
│       └── Logo.tsx
├── demo.html                 # Interactive test suite
├── manifest.json             # Manifest V3 configuration
├── vite.config.ts            # Multi-target bundler configuration
├── CONTRIBUTING.md           # Contribution guidelines
├── CODE_OF_CONDUCT.md        # Contributor covenant
├── SECURITY.md               # Zero-telemetry & vulnerability policy
├── CHANGELOG.md              # Semantic release notes
└── LICENSE                   # Apache 2.0 License
```

For detailed internal messaging protocols and lifecycle diagrams, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Privacy & Zero-Telemetry

Stop Play is proudly built with a **zero-telemetry guarantee**:
- Operates entirely locally inside Google Chrome using standard Manifest V3 APIs.
- Zero analytics, zero metrics, and zero remote tracking scripts.
- Your browsing history, visited URLs, and video titles never leave your local machine.

Read our full [Security Policy](SECURITY.md) for more details.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Build and test locally (`npm run build`).
4. Commit your changes (`git commit -m 'feat: add amazing feature'`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---


## License

This project is licensed under the **Apache License, Version 2.0** — see the [LICENSE](LICENSE) file for details.
