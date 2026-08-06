import type { AiSlot, PresetKey } from "../../shared/types.js";
import { buildGenericSendScript, genericAdapter } from "./genericAdapter.js";
import type { SiteAdapter } from "./types.js";

const namedAdapters: Partial<Record<PresetKey, SiteAdapter>> = {
  deepseek: namedGeneric("DeepSeek"),
  doubao: namedGeneric("豆包"),
  kimi: namedGeneric("Kimi"),
  tongyi: namedGeneric("通义千问"),
  zhipu: namedGeneric("智谱清言"),
  chatgpt: namedGeneric("ChatGPT"),
  gemini: namedGeneric("Google Gemini")
};

export function getAdapterForSlot(slot: AiSlot): SiteAdapter {
  if (slot.presetKey === "custom") return genericAdapter;
  return namedAdapters[slot.presetKey] ?? genericAdapter;
}

function namedGeneric(name: string): SiteAdapter {
  return {
    name,
    buildSendScript: (message) => buildGenericSendScript(message)
  };
}
