export type PresetKey =
  | "deepseek"
  | "doubao"
  | "kimi"
  | "tongyi"
  | "zhipu"
  | "chatgpt"
  | "gemini"
  | "custom";

export interface AiPreset {
  key: Exclude<PresetKey, "custom">;
  name: string;
  url: string;
}

export interface AiSlot {
  id: string;
  enabled: boolean;
  name: string;
  url: string;
  presetKey: PresetKey;
}

export interface AppSettings {
  slots: AiSlot[];
  selectedTargetIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
