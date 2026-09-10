# Contributing to Stop Play

Thank you for your interest in contributing to **Stop Play**! We welcome contributions from developers of all skill levels. Whether you are fixing a bug, adding a new feature, improving documentation, or optimizing performance, your help makes this project better for everyone.

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainer.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher (Node 20+ recommended)
- **npm**: Version 9.0 or higher
- **Google Chrome** (or any Chromium-based browser such as Brave, Edge, or Arc)

### Repository Setup

1. Fork the repository on GitHub:
   ```bash
   git clone https://github.com/<your-username>/Stop-Play.git
   cd Stop-Play
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Navigate to `chrome://extensions` in Google Chrome.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked**.
   - Select either the root repository directory or the `dist/` folder.
   - The **Stop Play** icon will appear in your browser toolbar.

---

## Development Workflow

### Available Scripts

- `npm run build`: Type-checks with `tsc` and compiles the production bundle using Vite.
- `npm run dev`: Runs Vite in development mode for hot-reloading the popup and options UI.
- `npm run typecheck`: Runs the TypeScript compiler to verify type integrity without emitting files.

### Testing Locally

- Use the included `demo.html` page to test video detection, pause/resume behavior, and in-page Dynamic Island HUD alerts.
- Test both within Chrome tabs (`Tab Switch`) and across external desktop applications (`App Switch`).
- Test with real video platforms (e.g. YouTube, Twitch, Spotify Web) to verify player behavior.

---

## Coding Guidelines

1. **TypeScript First**: Write strictly typed TypeScript code. Avoid using `any`.
2. **Clean Code**: Keep code concise, self-documenting, and free of redundant or dead comments.
3. **No Emojis in Extension Alerts**: Use clean SVG vector icons or plain text for system and HUD notifications.
4. **Isolated HUD Styling**: The Dynamic Island HUD must always run inside an isolated Shadow DOM (`#stop-play-hud-host`) with encapsulated styles to prevent CSS leaks into host pages.
5. **Manifest V3 Best Practices**: Maintain full Manifest V3 compatibility. Ensure service worker state is stateless or synchronized via `chrome.storage.local`.
6. **Path Resolution**: Extension resources must be loaded through relative paths or `chrome.runtime.getURL()` with appropriate declarations in `web_accessible_resources`.

---

## Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Make your modifications.
3. Ensure the project builds without errors:
   ```bash
   npm run build
   ```
4. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(lock): add per-tab background playback exemption"
   ```
5. Push to your fork and submit a Pull Request to `main`.
6. Clearly explain what changes were made, why they are needed, and how they were tested.

---

## Reporting Issues

If you find a bug or have a suggestion:
1. Search existing [GitHub Issues](https://github.com/sameershah/Stop-Play/issues) to see if it has already been reported.
2. If not, open a new issue using our issue templates with detailed reproduction steps, browser version, and OS environment.
