import { BrowserWindow, app, clipboard, ipcMain, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSettings, saveSettings } from "./settingsStore.js";
import type { AppSettings } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appName = "AIPanel";
const webviewPartitionPattern = /^persist:slot-\d+$/;

ipcMain.handle("settings:load", async () => loadSettings());
ipcMain.handle("settings:save", async (_event, settings: AppSettings) => saveSettings(settings));
ipcMain.handle("clipboard:writeText", async (_event, text: string) => {
  clipboard.writeText(text);
  return true;
});

function parseAbsoluteUrl(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedWebviewUrl(src: string | undefined) {
  const url = parseAbsoluteUrl(src);
  return url?.protocol === "http:" || url?.protocol === "https:";
}

function isAllowedWebviewPartition(partition: unknown): partition is string {
  return typeof partition === "string" && webviewPartitionPattern.test(partition);
}

function isAllowedAppNavigation(navigationUrl: string) {
  const url = parseAbsoluteUrl(navigationUrl);
  if (!url) return false;

  const devServerUrl = parseAbsoluteUrl(process.env.VITE_DEV_SERVER_URL);
  if (devServerUrl) return url.origin === devServerUrl.origin;

  return url.protocol === "file:";
}

function hardenWebviewPreferences(webPreferences: Electron.WebPreferences) {
  webPreferences.nodeIntegration = false;
  webPreferences.contextIsolation = true;
  webPreferences.sandbox = true;
  webPreferences.webSecurity = true;
  webPreferences.allowRunningInsecureContent = false;
  webPreferences.nodeIntegrationInSubFrames = false;
  webPreferences.nodeIntegrationInWorker = false;
  webPreferences.webviewTag = false;
  webPreferences.plugins = false;
  webPreferences.experimentalFeatures = false;
  webPreferences.enableWebSQL = false;

  delete webPreferences.preload;
  delete (webPreferences as Electron.WebPreferences & { preloadURL?: string }).preloadURL;
}

function hardenWebviewParams(params: Record<string, string>) {
  delete params.preload;
  delete params.preloadURL;
  delete params.allowpopups;
}

function denySessionPermissions(targetSession: Electron.Session) {
  targetSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  targetSession.setPermissionCheckHandler(() => false);
}

function configurePermissionHandlers() {
  denySessionPermissions(session.defaultSession);
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    title: appName,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    if (!isAllowedAppNavigation(navigationUrl)) event.preventDefault();
  });

  window.webContents.on("will-attach-webview", (event, webPreferences, params) => {
    if (!isAllowedWebviewUrl(params.src)) {
      event.preventDefault();
      return;
    }

    const partition = params.partition ?? webPreferences.partition;
    if (!isAllowedWebviewPartition(partition)) {
      event.preventDefault();
      return;
    }

    webPreferences.partition = partition;
    denySessionPermissions(session.fromPartition(partition));
    hardenWebviewPreferences(webPreferences);
    hardenWebviewParams(params);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  app.setName(appName);
  configurePermissionHandlers();
  return createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
