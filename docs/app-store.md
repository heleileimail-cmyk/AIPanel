# Mac App Store Preparation

This project has a separate Electron Builder path for Mac App Store builds.

## Local build commands

- `npm run package:mac` creates a regular macOS DMG in `release-builder/`.
- `npm run package:mas` creates a Mac App Store build in `release-builder/`.
- `npm run package:mas:unsigned` runs the MAS packaging path with automatic certificate discovery disabled. Use this to check how far the project gets before Apple certificates are installed.
- `npm run package:mac:legacy` keeps the original `electron-packager` command for comparison with the restored `release/` output.

## Apple account items you must provide

1. Apple Developer Program membership.
2. A real Bundle ID that matches `build.appId` in `package.json`.
3. A Mac App Store distribution certificate available in Keychain.
4. A Mac App Store provisioning profile downloaded from Apple Developer.
5. App Store Connect app record, screenshots, description, privacy policy URL, privacy questionnaire, age rating, and export compliance answers.

## Current defaults

- App name: `AIPanel`
- Bundle ID placeholder: `com.aipanel.desktop`
- Category: `public.app-category.productivity`
- MAS entitlements:
  - App Sandbox
  - Outbound network client access
  - User-selected read/write file access for the main app

## Before upload

Replace `com.aipanel.desktop` with the Bundle ID registered in Apple Developer, add the provisioning profile at `build/embedded.provisionprofile`, then run:

```bash
electron-builder --mac mas --arm64 -c.mas.provisioningProfile=build/embedded.provisionprofile
```

Upload the generated MAS artifact with Transporter or Xcode after the build is signed with the Mac App Store distribution certificate.

## Current verification note

The regular Electron Builder macOS DMG path works locally. The unsigned MAS preflight currently reaches Electron Builder's MAS packaging step, downloads the Electron MAS runtime, then fails or stalls while unpacking/renaming the MAS Electron app in this local no-certificate environment. Re-run `npm run package:mas` after installing the Apple distribution certificate and provisioning profile; if the same unpacking failure appears with signing available, pin Electron to a MAS-compatible version verified by Electron Builder for the release.
