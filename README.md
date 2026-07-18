# <u>Relay</u>

A **privacy-first**, *open-source* device hub that connects your machines over your local network.  
No cloud, no accounts — just fast, secure communication between devices you own.

---

## Features

<u>Clipboard Sync</u> — Copy on one device, paste on another.  
Clipboard text is transferred directly between paired devices over your local network **instantly**.

<u>File Transfers</u> — Send files between devices over direct TCP connections with *real-time progress*.  
No size limits, no intermediate storage.

<u>Device Discovery</u> — Automatic detection of Relay instances on the same subnet via **UDP multicast**.  
No IP addresses or manual configuration required.

<u>Pairing System</u> — Secure code-based pairing with request/accept flow.  
Trusted devices are remembered and *auto-connect* when they come online.

---

## Installation

### Linux (.deb)

```bash
sudo dpkg -i relay_0.1.0_amd64.deb
```

### Windows (.exe)

Run the installer and follow the prompts.

---

## Development

```bash
npm install
npm run dev           # vite dev server (renderer)
npm run electron:dev  # run full Electron app
npm run build         # typecheck + build
npm run lint          # lint
```

### Multi-instance testing

```bash
npm run MI1  # Relay-Alpha
npm run MI2  # Relay-Beta
```

---

## <u>Build</u>

```bash
# Package for Linux
npm run package:linux

# Package for Windows
npm run package:win

# Package for all platforms
npm run package:all
```

---

## Notes

- All communication happens over your **local network**. No data is ever sent to external servers.
- Devices **must** be on the same subnet for discovery to work.
- *macOS support is planned for a future release.*
- Relay is still in development — *expect some bugs*.

---

## License

**MIT** — Relay Contributors
