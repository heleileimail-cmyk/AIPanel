type AppSettings = {
  slots: unknown[];
  selectedTargetIds: string[];
};

const { contextBridge, ipcRenderer } = require("electron");

const api = {
  version: "0.1.0",
  loadSettings: () => ipcRenderer.invoke("settings:load") as Promise<AppSettings>,
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("settings:save", settings) as Promise<AppSettings>,
  writeClipboardText: (text: string) => ipcRenderer.invoke("clipboard:writeText", text) as Promise<boolean>
};

contextBridge.exposeInMainWorld("multiAi", api);
