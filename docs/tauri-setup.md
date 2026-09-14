# Tauri 2.0 Desktop Setup Guide

Shot2Code includes a native desktop shell powered by Tauri 2.0 and Rust. This enables global hotkey triggers (`Ctrl+Shift+C` on Windows/Linux, `Cmd+Shift+C` on macOS) and transparent desktop overlays.

## Prerequisites

1. **Node.js:** v18 or later
2. **Rust Toolchain:** Stable channel
   ```bash
   # Install via rustup (Windows / macOS / Linux)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **Platform Dependencies:**
   - **Windows:** Microsoft Visual Studio C++ Build Tools and WebView2 Runtime (pre-installed on Windows 10 and 11).
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`).
   - **Linux:** WebKit2GTK and build essentials:
     ```bash
     sudo apt update && sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libayatana-appindicator3-dev librsvg2-dev
     ```

## Development

Run the web frontend with the Tauri native window wrapper:

```bash
# Install Tauri CLI globally
npm install -g @tauri-apps/cli

# Run development server with native shell
cargo tauri dev
```

The desktop app will launch and load the Vite development server running on `http://localhost:3000`.

## Building Release Packages

To build production installers:

```bash
cargo tauri build
```

This generates:
- **Windows:** `.msi` and standalone `.exe` installers in `src-tauri/target/release/bundle/msi/`.
- **macOS:** `.dmg` and `.app` bundles in `src-tauri/target/release/bundle/dmg/`.
- **Linux:** `.deb` and `.AppImage` packages in `src-tauri/target/release/bundle/appimage/`.

## Configuration (`src-tauri/tauri.conf.json`)

The desktop window is configured with the following defaults:
- Minimum window dimensions: 900 x 600 px
- Initial window dimensions: 1280 x 840 px
- Native clipboard integration and global shortcut permissions.
