import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { createDefaultSettings, migrateSettings, validateSettings } from "../shared/settingsValidation.js";
import type { AppSettings } from "../shared/types.js";

const fileName = "settings.json";

export function getSettingsPath(): string {
  return path.join(app.getPath("userData"), fileName);
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!hasSettingsShape(parsed)) {
      return createDefaultSettings();
    }

    const migrated = migrateSettings(parsed);
    if (!validateSettings(migrated).valid) {
      return createDefaultSettings();
    }

    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      await fs.writeFile(getSettingsPath(), JSON.stringify(migrated, null, 2), "utf8");
    }
    return migrated;
  } catch {
    return createDefaultSettings();
  }
}

export async function saveSettings(settings: unknown): Promise<AppSettings> {
  const validation = validateSettings(settings);
  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  await fs.mkdir(path.dirname(getSettingsPath()), { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2), "utf8");
  return settings as AppSettings;
}

function hasSettingsShape(value: unknown): value is AppSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<AppSettings>;
  return Array.isArray(candidate.slots) && Array.isArray(candidate.selectedTargetIds);
}
