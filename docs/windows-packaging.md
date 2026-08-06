# Windows Packaging

AIPanel can be packaged as a Windows x64 installer with Electron Builder.

## Build commands

- `npm run package:win` builds a Windows NSIS installer `.exe` in `release-builder/`.
- `npm run package:win:portable` builds a portable `.exe` that does not require installation.

## Installer behavior

The NSIS installer is configured to:

- Show an install wizard instead of one-click install.
- Let the user choose the installation directory.
- Install for the current user by default.
- Create desktop and Start Menu shortcuts.
- Keep user data when uninstalling.

## Before sharing widely

For internal use, the unsigned `.exe` is usually enough, though Windows SmartScreen may warn users. For public distribution, buy or use a Windows code-signing certificate and configure Electron Builder signing before release.

## Apple Silicon Mac note

On Apple Silicon Macs, Electron Builder can create `release-builder/win-unpacked/AIPanel.exe`, but the final NSIS installer step can fail because the bundled `makensis` binary is x64-only for macOS. When that happens, use the generated `release-builder/AIPanel-0.1.0-win-x64-unpacked.zip` for manual installation, or run this project on a Windows x64 machine:

```bash
npm install
npm run package:win
```

The Windows machine will generate the installer `.exe` in `release-builder/`.
