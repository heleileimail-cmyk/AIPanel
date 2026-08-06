import { AI_PRESETS } from "./presets.js";
import type { AiSlot, AppSettings, ValidationResult } from "./types.js";

const defaultPresetOrder = [
  AI_PRESETS.deepseek,
  AI_PRESETS.doubao,
  AI_PRESETS.kimi,
  AI_PRESETS.tongyi,
  AI_PRESETS.zhipu,
  AI_PRESETS.chatgpt,
  AI_PRESETS.gemini
];
const builtInSlotIds = defaultPresetOrder.map((_, index) => `slot-${index + 1}`);
const minimumSlotCount = builtInSlotIds.length;
const slotIdPattern = /^slot-[1-9]\d*$/;
const validPresetKeys = new Set(["deepseek", "doubao", "kimi", "tongyi", "zhipu", "chatgpt", "gemini", "custom"]);

export { AI_PRESETS };

export function createDefaultSettings(): AppSettings {
  const slots: AiSlot[] = defaultPresetOrder.map((preset, index) => ({
    id: `slot-${index + 1}`,
    enabled: index < 3,
    name: preset.name,
    url: preset.url,
    presetKey: preset.key
  }));

  return {
    slots,
    selectedTargetIds: slots.filter((slot) => slot.enabled).map((slot) => slot.id)
  };
}

export function migrateSettings(settings: AppSettings): AppSettings {
  const slots = settings.slots.map((slot) => ({ ...slot }));
  let selectedTargetIds = [...settings.selectedTargetIds];

  if (slots.length !== 6) {
    return {
      ...settings,
      slots
    };
  }

  const sixthSlot = slots[5];
  const sixthSlotIsGemini = sixthSlot?.presetKey === "gemini" || sixthSlot?.url === AI_PRESETS.gemini.url;

  if (sixthSlotIsGemini) {
    slots[5] = {
      id: "slot-6",
      enabled: false,
      name: AI_PRESETS.chatgpt.name,
      url: AI_PRESETS.chatgpt.url,
      presetKey: AI_PRESETS.chatgpt.key
    };
    slots.push({
      ...sixthSlot,
      id: "slot-7",
      name: AI_PRESETS.gemini.name,
      url: AI_PRESETS.gemini.url,
      presetKey: AI_PRESETS.gemini.key
    });
    selectedTargetIds = selectedTargetIds.map((id) => (id === "slot-6" ? "slot-7" : id));
  } else {
    slots.push({
      id: "slot-7",
      enabled: false,
      name: AI_PRESETS.gemini.name,
      url: AI_PRESETS.gemini.url,
      presetKey: AI_PRESETS.gemini.key
    });
  }

  return {
    ...settings,
    slots,
    selectedTargetIds
  };
}

export function validateSettings(settings: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(settings)) {
    return {
      valid: false,
      errors: ["设置必须是对象。"]
    };
  }

  const slotsValue = settings.slots;
  const selectedTargetIdsValue = settings.selectedTargetIds;
  const hasValidSelectedTargetIds =
    Array.isArray(selectedTargetIdsValue) && selectedTargetIdsValue.every((id) => typeof id === "string");

  if (!Array.isArray(slotsValue)) {
    errors.push("设置必须包含槽位数组。");
  }

  if (!hasValidSelectedTargetIds) {
    errors.push("发送目标必须是字符串数组。");
  }

  if (!Array.isArray(slotsValue)) {
    return {
      valid: false,
      errors
    };
  }

  let hasSlotShapeError = false;

  if (slotsValue.length < minimumSlotCount) {
    errors.push("设置必须包含 7 个槽位。");
    hasSlotShapeError = true;
  }

  const slots: AiSlot[] = [];
  const seenSlotIds = new Set<string>();
  let hasDuplicateSlotId = false;
  let hasInvalidSlotIdFormat = false;
  let hasInvalidBuiltInSlotId = false;

  slotsValue.forEach((slot, index) => {
    const fallbackSlotId = `slot-${index + 1}`;

    if (!isRecord(slot)) {
      errors.push(`${fallbackSlotId} 必须是对象。`);
      hasSlotShapeError = true;
      return;
    }

    const id = slot.id;
    const enabled = slot.enabled;
    const name = slot.name;
    const url = slot.url;
    const presetKey = slot.presetKey;
    const slotLabel = typeof id === "string" ? id : fallbackSlotId;

    if (typeof id !== "string") {
      errors.push(`${fallbackSlotId} 需要有效 ID。`);
      hasSlotShapeError = true;
    } else {
      if (!slotIdPattern.test(id)) {
        hasInvalidSlotIdFormat = true;
      } else if (index < builtInSlotIds.length && id !== builtInSlotIds[index]) {
        hasInvalidBuiltInSlotId = true;
      }

      if (seenSlotIds.has(id)) {
        hasDuplicateSlotId = true;
      }
      seenSlotIds.add(id);
    }

    if (typeof enabled !== "boolean") {
      errors.push(`${slotLabel} 需要启用状态。`);
      hasSlotShapeError = true;
    }

    if (typeof name !== "string") {
      errors.push(`${slotLabel} 需要名称。`);
      hasSlotShapeError = true;
    }

    if (typeof url !== "string") {
      errors.push(`${slotLabel} 的网址必须是字符串。`);
      hasSlotShapeError = true;
    }

    if (typeof presetKey !== "string" || !validPresetKeys.has(presetKey)) {
      errors.push(`${slotLabel} 的预设无效。`);
      hasSlotShapeError = true;
    }

    if (
      typeof id === "string" &&
      typeof enabled === "boolean" &&
      typeof name === "string" &&
      typeof url === "string" &&
      typeof presetKey === "string" &&
      validPresetKeys.has(presetKey)
    ) {
      slots.push({ id, enabled, name, url, presetKey: presetKey as AiSlot["presetKey"] });
    }
  });

  if (hasInvalidSlotIdFormat) {
    errors.push("槽位 ID 必须使用 slot-数字格式。");
    hasSlotShapeError = true;
  }

  if (hasInvalidBuiltInSlotId && !hasDuplicateSlotId) {
    errors.push("前 7 个内置槽位 ID 必须是 slot-1 到 slot-7。");
    hasSlotShapeError = true;
  }

  if (hasDuplicateSlotId) {
    errors.push("槽位 ID 不能重复。");
    hasSlotShapeError = true;
  }

  const enabledSlots = slots.filter((slot) => slot.enabled);
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const selectedTargetIds = new Set<string>();

  if (!hasSlotShapeError) {
    if (enabledSlots.length < 3) {
      errors.push("至少需要启用 3 个 AI 窗口。");
    }

    if (enabledSlots.length > 6) {
      errors.push("最多只能启用 6 个 AI 窗口。");
    }

    for (const slot of enabledSlots) {
      if (!slot.name.trim()) {
        errors.push(`${slot.id} 需要名称。`);
      }

      if (!isValidUrl(slot.url)) {
        errors.push(`${slot.name || slot.id} 的网址无效。`);
      }
    }
  }

  if (hasValidSelectedTargetIds && !hasSlotShapeError) {
    for (const id of selectedTargetIdsValue) {
      if (selectedTargetIds.has(id)) {
        errors.push("发送目标不能重复。");
        continue;
      }

      selectedTargetIds.add(id);

      const slot = slotsById.get(id);

      if (!slot) {
        errors.push(`发送目标 ${id} 不存在。`);
        continue;
      }

      if (!slot.enabled) {
        errors.push(`发送目标 ${id} 未启用。`);
      }
    }

    if (selectedTargetIds.size > 6) {
      errors.push("最多只能选择 6 个发送窗口。");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
