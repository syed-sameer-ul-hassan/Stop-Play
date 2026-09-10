# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

---

## Zero-Telemetry & Privacy Guarantee

Stop Play is designed from the ground up with a strict privacy-first architecture:

- **100% Local Execution**: All logic runs locally inside your browser via Manifest V3 Chrome Extension APIs.
- **Zero Remote Communication**: Stop Play does not send any telemetry, analytics, URLs, page titles, or browsing history to any external server.
- **Local Storage Only**: User preferences and muted allowlists are stored exclusively in Chrome's local storage (`chrome.storage.local`).
- **No Third-Party Trackers**: The extension contains zero tracking scripts, remote CDN dependencies, or ad scripts.

---

## Reporting a Vulnerability

If you discover a potential security vulnerability in Stop Play:

1. **Do not** report security issues publicly on the GitHub Issue Tracker.
2. Please disclose responsibly by contacting the maintainer directly through [https://sameershah.dev](https://sameershah.dev) or by creating a private security advisory on GitHub.
3. Include detailed steps to reproduce the vulnerability, along with your browser environment and operating system.
4. We will acknowledge receipt of your report within 48 hours and work towards releasing a prompt fix.
