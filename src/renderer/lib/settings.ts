import type { AppSettings } from "../../shared/types";

declare global {
  interface Window {
    multiAi: {
      version: string;
      loadSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<AppSettings>;
      writeClipboardText: (text: string) => Promise<boolean>;
    };
  }
}

export function loadSettings() {
  return window.multiAi.loadSettings();
}

export function saveSettings(settings: AppSettings) {
  return window.multiAi.saveSettings(settings);
}

export function writeClipboardText(text: string) {
  return window.multiAi.writeClipboardText(text);
}
