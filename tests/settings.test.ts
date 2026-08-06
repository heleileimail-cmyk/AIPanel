import { describe, expect, it } from "vitest";
import {
  AI_PRESETS,
  createDefaultSettings,
  migrateSettings,
  validateSettings
} from "../src/shared/settingsValidation";

describe("settings validation", () => {
  it("creates seven built-in slots with three enabled defaults", () => {
    const settings = createDefaultSettings();

    expect(settings.slots).toHaveLength(7);
    expect(settings.slots.filter((slot) => slot.enabled)).toHaveLength(3);
    expect(settings.slots[0].presetKey).toBe("deepseek");
    expect(settings.slots[1].presetKey).toBe("doubao");
    expect(settings.slots[2].presetKey).toBe("kimi");
    expect(settings.slots[5].presetKey).toBe("chatgpt");
    expect(settings.slots[6].presetKey).toBe("gemini");
    expect(settings.selectedTargetIds).toEqual(["slot-1", "slot-2", "slot-3"]);
  });

  it("accepts extra custom slots beyond the seven built-in shortcuts", () => {
    const settings = createDefaultSettings();
    settings.slots.push({
      id: "slot-8",
      enabled: false,
      name: "自定义 AI",
      url: "",
      presetKey: "custom"
    });

    expect(validateSettings(settings)).toEqual({
      valid: true,
      errors: []
    });
  });

  it("contains required built-in AI presets", () => {
    expect(Object.keys(AI_PRESETS)).toEqual([
      "deepseek",
      "doubao",
      "kimi",
      "tongyi",
      "zhipu",
      "chatgpt",
      "gemini"
    ]);
  });

  it("adds Gemini to an old six-slot setting without replacing ChatGPT", () => {
    const oldSettings = createDefaultSettings();
    oldSettings.slots = oldSettings.slots.slice(0, 6);
    oldSettings.slots[5] = {
      id: "slot-6",
      enabled: true,
      name: "ChatGPT",
      url: "https://chatgpt.com/",
      presetKey: "chatgpt"
    };
    oldSettings.selectedTargetIds = ["slot-1", "slot-2", "slot-6"];

    const migrated = migrateSettings(oldSettings);

    expect(migrated.slots[5]).toEqual({
      id: "slot-6",
      enabled: true,
      name: "ChatGPT",
      url: "https://chatgpt.com/",
      presetKey: "chatgpt"
    });
    expect(migrated.slots[6]).toEqual({
      id: "slot-7",
      enabled: false,
      name: "Google Gemini",
      url: "https://gemini.google.com/",
      presetKey: "gemini"
    });
    expect(migrated.selectedTargetIds).toEqual(["slot-1", "slot-2", "slot-6"]);
  });

  it("moves the previous Gemini-over-ChatGPT migration into a seventh slot", () => {
    const oldSettings = createDefaultSettings();
    oldSettings.slots = oldSettings.slots.slice(0, 6);
    oldSettings.slots[5] = {
      id: "slot-6",
      enabled: true,
      name: "Google Gemini",
      url: "https://gemini.google.com/",
      presetKey: "gemini"
    };
    oldSettings.selectedTargetIds = ["slot-1", "slot-2", "slot-6"];

    const migrated = migrateSettings(oldSettings);

    expect(migrated.slots[5]).toEqual({
      id: "slot-6",
      enabled: false,
      name: "ChatGPT",
      url: "https://chatgpt.com/",
      presetKey: "chatgpt"
    });
    expect(migrated.slots[6]).toEqual({
      id: "slot-7",
      enabled: true,
      name: "Google Gemini",
      url: "https://gemini.google.com/",
      presetKey: "gemini"
    });
    expect(migrated.selectedTargetIds).toEqual(["slot-1", "slot-2", "slot-7"]);
  });

  it("rejects fewer than three enabled slots", () => {
    const settings = createDefaultSettings();
    settings.slots[2].enabled = false;
    settings.selectedTargetIds = ["slot-1", "slot-2"];

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["至少需要启用 3 个 AI 窗口。"]
    });
  });

  it("rejects more than six enabled and selected slots", () => {
    const settings = createDefaultSettings();
    settings.slots = settings.slots.map((slot) => ({ ...slot, enabled: true }));
    settings.selectedTargetIds = settings.slots.map((slot) => slot.id);

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["最多只能启用 6 个 AI 窗口。", "最多只能选择 6 个发送窗口。"]
    });
  });

  it("rejects enabled custom slots without a valid URL", () => {
    const settings = createDefaultSettings();
    settings.slots[3] = {
      id: "slot-4",
      enabled: true,
      name: "Custom AI",
      url: "notaurl",
      presetKey: "custom"
    };

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["Custom AI 的网址无效。"]
    });
  });

  it("rejects duplicate selected target IDs", () => {
    const settings = createDefaultSettings();
    settings.selectedTargetIds = ["slot-1", "slot-1"];

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["发送目标不能重复。"]
    });
  });

  it("rejects nonexistent selected target IDs", () => {
    const settings = createDefaultSettings();
    settings.selectedTargetIds = ["slot-1", "slot-99"];

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["发送目标 slot-99 不存在。"]
    });
  });

  it("rejects disabled selected target IDs", () => {
    const settings = createDefaultSettings();
    settings.selectedTargetIds = ["slot-4"];

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["发送目标 slot-4 未启用。"]
    });
  });

  it("rejects malformed top-level values without throwing", () => {
    expect(() => validateSettings(null)).not.toThrow();
    expect(validateSettings(null)).toEqual({
      valid: false,
      errors: ["设置必须是对象。"]
    });
  });

  it("rejects disabled slots with malformed fields", () => {
    const settings = createDefaultSettings();
    const malformed = {
      ...settings,
      slots: settings.slots.map((slot) => ({ ...slot }))
    };

    delete (malformed.slots[3] as Partial<(typeof malformed.slots)[number]>).name;
    (malformed.slots[4] as unknown as { url: unknown }).url = 42;

    expect(validateSettings(malformed)).toEqual({
      valid: false,
      errors: ["slot-4 需要名称。", "slot-5 的网址必须是字符串。"]
    });
  });

  it("rejects settings that do not contain the seven built-in slots", () => {
    const settings = createDefaultSettings();
    settings.slots = settings.slots.slice(0, 6);

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["设置必须包含 7 个槽位。"]
    });
  });

  it("rejects settings whose first seven slot IDs are not the built-in slots", () => {
    const settings = createDefaultSettings();
    settings.slots[1].id = "slot-9";

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["前 7 个内置槽位 ID 必须是 slot-1 到 slot-7。"]
    });
  });

  it("rejects invalid preset keys", () => {
    const settings = createDefaultSettings();
    const malformed = {
      ...settings,
      slots: settings.slots.map((slot) => ({ ...slot }))
    };

    (malformed.slots[0] as unknown as { presetKey: string }).presetKey = "claude";

    expect(validateSettings(malformed)).toEqual({
      valid: false,
      errors: ["slot-1 的预设无效。"]
    });
  });

  it("rejects duplicate slot IDs", () => {
    const settings = createDefaultSettings();
    const malformed = {
      ...settings,
      slots: settings.slots.map((slot) => ({ ...slot }))
    };
    malformed.slots[1].id = "slot-1";

    expect(validateSettings(malformed)).toEqual({
      valid: false,
      errors: ["槽位 ID 不能重复。"]
    });
  });

  it("rejects slot IDs that are not in slot-number format", () => {
    const settings = createDefaultSettings();
    settings.slots[1].id = "custom-2";

    expect(validateSettings(settings)).toEqual({
      valid: false,
      errors: ["槽位 ID 必须使用 slot-数字格式。"]
    });
  });

  it("rejects selected target IDs that are not a string array", () => {
    const settings = createDefaultSettings();
    const malformed = {
      ...settings,
      selectedTargetIds: ["slot-1", 2]
    };

    expect(validateSettings(malformed)).toEqual({
      valid: false,
      errors: ["发送目标必须是字符串数组。"]
    });
  });
});
