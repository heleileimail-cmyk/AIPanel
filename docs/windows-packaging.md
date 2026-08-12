# Windows Packaging

AIPanel can be packaged as a Windows x64 installer with Electron Builder.

## Build commands

- `npm run package:win` builds a Windows NSIS installer `.exe` in `release-builder/`.
- `npm run package:win:portable` builds a portable `.exe` that does not require installation.

## GitHub Actions release build

The `Build Windows installer` workflow builds the signed-off source on a Windows x64 GitHub runner and uploads the resulting installer to an existing GitHub Release.

1. Open the repository's **Actions** tab.
2. Select **Build Windows installer**.
3. Choose **Run workflow** and enter a release tag that matches the version in `package.json`, such as `v0.1.1`.
4. After the job succeeds, download the `.exe` from that release or from the workflow artifacts.

The workflow runs type checks and unit tests before packaging. It stops without uploading if the requested release tag does not match the package version.

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

On Apple Silicon Macs, Electron Builder can create `release-builder/win-unpacked/AIPanel.exe`, but the final NSIS installer step can fail because the bundled `makensis` binary is x64-only for macOS. When that happens, run the GitHub Actions release build above or build this project on a Windows x64 machine:

```bash
npm install
npm run package:win
```

The Windows machine will generate the installer `.exe` in `release-builder/`.
