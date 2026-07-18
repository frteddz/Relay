# Changelog

All notable changes to Relay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.3-A] - 2026-07-19

### Added
- **Embedded signaling server** — Electron now auto-starts the WebSocket signaling server on port 4001 (fallback 4002) at launch. No manual `node server/signaling.mjs` required.
- **Signaling server URL in UDP beacon** — Desktop devices now broadcast their signaling server address (`ws://<ip>:4001`) in multicast beacons, enabling other devices to discover and connect.
- **Auto-discovery of signaling server on Android** — `WebMdnsTransport` now checks for a saved signaling URL on startup, and QR scan automatically configures the connection URL.
- **HTTP discovery endpoint** — Signaling server serves `/discovery` returning its IP and WebSocket URL for programmatic discovery.
- **Mobile slide-out navigation drawer** — Replaced the bottom tab bar with a native-feeling hamburger menu and slide-out drawer with smooth open/close animations, backdrop overlay, and touch-friendly targets.
- **History page** — New `/history` page with three tabs: Pairing, Transfers, and Clipboard. All history persists in localStorage across restarts. Includes search, direction filtering, and clear history.
- **ClockIcon** — Added to the icon set for the History page.
- **Android permissions** — Added `CAMERA`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `CHANGE_WIFI_MULTICAST_STATE` to AndroidManifest.xml. Added `usesCleartextTraffic="true"` and camera hardware feature declarations.

### Fixed
- **Android cannot discover Desktop** — Root cause: default `ws://localhost:4001` resolves to the phone itself. Fixed by auto-starting the signaling server in Electron and persisting the signaling URL when configured via QR scan or settings.
- **Camera permission not requested on Android** — Root cause: `CAMERA` permission was missing from AndroidManifest.xml. Added the permission declaration; Capacitor's WebView now triggers the runtime permission dialog automatically.
- **"Signaling not available" error on Desktop** — Root cause: signaling server was not running. Fixed by auto-starting it in the Electron main process.
- **WebSocket errors silently swallowed** — Added connection status callback to `WebMdnsTransport` for UI feedback on connection state.
- **QR scan not updating signaling URL** — QR scan now calls `updateSignalingUrl()` to redirect the transport to the correct server before sending pairing signals.
- **Version strings inconsistent** — All version references across the codebase now consistently use `v0.1.3-A` prefix.
- **Android build missing `ANDROID_HOME`** — `cap:build:android` script now exports all required environment variables.
- **Clipboard sync not writing to system clipboard on Electron** — Added `writeToClipboard()` call on `onSyncReceived`.
- **Bottom nav padding unnecessary** — Removed `pb-20` from main content area since bottom nav was replaced by drawer.

### Changed
- **`DeviceBeacon` interface** — Added optional `serverUrl` field for signaling server address.
- **`RelayDiscovery` constructor** — Accepts `serverUrl` option, included in multicast beacons.
- **`WebMdnsTransport`** — Added `updateUrl()`, `getUrl()`, `setOnConnectionStatus()` methods. Saves/loads signaling URL from localStorage. Auto-uses saved URL on startup.
- **`CoreContext` interface** — Added `updateSignalingUrl()` method.
- **`PairingPage`** — QR scan now extracts and applies the signaling server URL from the QR payload.
- **Navigation** — Added "History" link to both desktop sidebar and mobile drawer.
- **`Sidebar`** — Desktop sidebar unchanged. Mobile replaced bottom nav with hamburger-triggered slide-out drawer.
- **`AppShell`** — Version bumped to v0.1.3-A.
- **`package.json`** — Version bumped to 0.1.3-A.
- **`android/app/build.gradle`** — versionCode 4, versionName 0.1.3-A.

### Removed
- Mobile bottom navigation bar (replaced by slide-out drawer).

---

## [v0.1.2-A] - 2026-07-18

### Added
- **Android support** — Capacitor-wrapped APK via `@capacitor/android`, `@capacitor/clipboard`, and `@capacitor/cli`.
- **Android app icon** — Multi-density adaptive icon (`mdpi` through `xxxhdpi`) generated from `logotransparent.png` with brand-colored background (`#6366F1`).
- **QR code pairing** — Generate a QR code containing device ID, name, signaling server URL, and short pairing code. Other devices scan to pair instantly.
- **Camera QR scanning** — Built-in camera scanner using `html5-qrcode` with rear-camera preference, permission handling, and real-time feedback.
- **4-digit code pairing** — Generate a short numeric code; enter it on the other device to pair. Code expires after 60 seconds with a visual countdown.
- **Pair-verify signal protocol** — New `pair-verify` / `pair-verified` signal types for secure code-based pairing over the signaling server, with targeted delivery to specific devices.
- **Targeted signal delivery** — `sendSignal` now accepts an optional `targetId` parameter, forwarded through the WebSocket signaling server to deliver signals only to the intended recipient.
- **Signaling server URL setting** — Configurable WebSocket signaling server URL in Settings (default: `ws://localhost:4001`). Required for cross-device web/Capacitor communication.
- **Landing page "Versions" link** — Navbar link to GitHub Releases page for download history.
- **`npm run package:all`** — Now builds all three platforms: Linux `.deb`, Windows `.exe`, and Android `.apk` in a single command.

### Fixed
- **Clipboard sync not writing to system clipboard** — Incoming clipboard data via Electron IPC now calls `writeToClipboard()` to persist to the OS clipboard, not just the internal history.
- **Clipboard sync Capacitor detection** — Replaced per-call `@capacitor/core` imports with a cached, single-import detection pattern for reliable performance.
- **Clipboard sync retry logic** — `sendClipboardToDevices` now retries failed signal sends up to 2 times with a 500ms delay, and wraps Electron IPC calls in try/catch.
- **Android build missing `ANDROID_HOME`** — `cap:build:android` script now exports `ANDROID_HOME` to resolve SDK location errors.
- **QR code payload incomplete** — QR codes now include the short pairing code so scanned devices can auto-send `pair-verify` without manual code entry.
- **`pair-verify` signal sent but never received** — Added signal handlers in `core/index.ts` for `pair-verify` (validates code, trusts sender, responds) and `pair-verified` (trusts sender, emits trust-changed event).
- **`codesMatch` was private** — Exported from `PairingService.ts` for use in signal handlers with constant-time comparison.
- **Landing page download URLs** — All platform download links now point to correct v0.1.2-A release assets.

### Changed
- **PairingPage redesigned** — Three tabs: "Show Code" (QR + 4-digit), "Scan QR" (camera), and "Enter Code" (manual). Short code is stored on the core context for signal-handler access.
- **Short code lifecycle** — Generated codes are set on `CoreContext.activeShortCode` and cleared on expiry or unmount, preventing stale verification.

### Removed
- Broken unicast signal socket (port 41235) from earlier architecture.

---

## [v0.1.1-dev] - 2026-07-17

> **Note:** This version was broken on mobile and was never publicly released.

### Added
- **Capacitor setup** — `capacitor.config.json`, Android project scaffold, `cap:sync` and `cap:build:android` npm scripts.
- **Multi-instance dev mode** — `npm run MI1` through `MI6` scripts with unique `RELAY_INSTANCE_ID` and `RELAY_DEVICE_NAME` environment variables.
- **Custom title bar** — Transparent draggable bar with minimize, maximize, and close buttons via IPC handlers.
- **Theme system** — Full light/dark mode via CSS overrides in `index.css`, persisted to localStorage, inline script prevents flash on load.
- **Loading screen** — Inline animated splash in `index.html` that fades out after React mounts.
- **CSS animations** — `slide-in-left`, `fade-in`, `slide-up` with staggered delays for list items and navigation entries.
- **Text selection disabled** — `user-select: none` on body to prevent accidental text selection during navigation.
- **WebSocket signaling server** — `server/signaling.mjs` with room management, peer presence tracking, and targeted signal relay.
- **WebMdnsTransport** — `src/core/discovery/WebMdnsTransport.ts` bridging WebSocket signaling into the discovery transport interface.
- **Cross-platform clipboard sync** — `sendClipboardToDevices()` saves locally first, then sends via IPC (Electron) or WebSocket signal (web).
- **TCP file transfer** — Ephemeral TCP server per transfer with `transfer-request` signal, receiver auto-connects and saves to `~/Downloads/Relay/`.
- **Transfer progress events** — Both sender and receiver see real-time progress bars, speed, and remaining time.
- **Desktop notifications** — Electron `Notification` API for incoming pairing, acceptance, clipboard, and transfer events.
- **Save received files** — `transfer:save-file` IPC opens `dialog.showSaveDialog` for choosing save location.
- **ClipboardPage redesign** — Two explicit buttons: "Save Locally" and "Send to Paired Device".
- **TransferPage** — Drag-drop zone, Browse Files button, active transfers with progress, incoming auto-accepted, Save button on completed.
- **First-run Terms & Conditions** — Scroll-to-bottom to enable "I Agree", versioned acceptance stored in localStorage.
- **Device details pairing** — DeviceDetailsPage uses `sendPairRequest`, incoming request detection with Accept/Decline, forget device.
- **Pairing state persistence** — `core.pairing` saves to localStorage, restored on startup. Trusted devices survive restarts.
- **OnlineBadge component** — Shared badge used across Dashboard and DevicesPage for consistent device status display.

### Fixed
- **Same-IP discovery** — Removed `rinfo.address === this.localIp` filter so devices on the same machine can discover each other.
- **Pairing lifecycle** — `DeviceRegistry` populated in IPC discovery handlers; `acceptIncomingRequest` uses `core.pairing.trust()` + `core.connection.connect()`.
- **Clipboard sync broken** — Two root causes fixed: (1) incoming clipboard data never written to system clipboard; (2) web `fromId` hardcoded `"web"` breaking trust check.
- **Toggle thumb positioning** — CSS fix for toggle switch thumb alignment.

### Changed
- **Signaling architecture reworked** — Removed unicast signal socket (port 41235). Signals now sent via multicast channel with `_type: "signal"` wrapper, filtered by `toId` on each instance.
- **IPC chain for pairing** — Added `targetId` field to `sendRequest`/`sendResponse` args for targeted delivery.

---

## [v0.1.0] - 2026-07-16

### Added
- **Electron desktop app** — Cross-platform desktop application built with Electron and Vite.
- **UDP multicast discovery** — Real LAN device discovery via `239.255.224.111:41234` using Node.js `dgram` in `electron/discovery.ts`.
- **IPC bridge** — Full preload API for discovery, network info, pairing, window controls, clipboard, transfer, and app navigation.
- **IpcMdnsTransport** — Bridges main-process discovery events into the renderer's `MdnsTransport` interface.
- **PairingService** — Code-based pairing flow with expiry, constant-time comparison, and max attempts.
- **TransferManager** — Proper enqueue/pause/resume/cancel tracking for file transfers.
- **Pairing notifications** — Accept/decline UI for incoming pairing requests with notification badges.
- **Dashboard** — Device overview, quick actions, clipboard history, recent transfers.
- **Devices page** — Full device list with state indicators, device details page with pairing controls.
- **Clipboard page** — Local clipboard history management.
- **Transfer page** — File transfer management with progress tracking.
- **Settings page** — Device name, auto-discovery toggle, theme selection, version display.
- **Landing page** — Marketing site with Hero, Features, Cross-Platform, FAQ, and Footer sections.
- **Linux `.deb` package** — Built via `electron-builder` with proper hicolor icons and desktop integration.
- **Windows `.exe` installer** — NSIS-based installer built via `electron-builder`.
- **GitHub release v0.1.0** — Published at `github.com/frteddz/Relay/releases/tag/v0.1.0`.

### Security
- **Constant-time code comparison** — Pairing codes compared using bitwise XOR accumulation to prevent timing attacks.
