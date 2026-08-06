import { AI_PRESETS } from "../../shared/presets.js";
import { validateSettings } from "../../shared/settingsValidation.js";
import type { AiSlot, AppSettings, PresetKey } from "../../shared/types.js";

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onSave: () => void;
  onClose: () => void;
}

const builtInSlotCount = 7;
const maxEnabledSlots = 6;

export function SettingsPanel({ settings, onChange, onSave, onClose }: SettingsPanelProps) {
  const validation = validateSettings(settings);
  const enabledCount = settings.slots.filter((slot) => slot.enabled).length;

  function updateSlot(index: number, nextSlot: AiSlot) {
    const slots = settings.slots.map((slot, slotIndex) => (slotIndex === index ? nextSlot : slot));
    const enabledSlotIds = new Set(slots.filter((slot) => slot.enabled).map((slot) => slot.id));
    const selectedTargetIds = settings.selectedTargetIds.filter((id) => enabledSlotIds.has(id));

    onChange({ ...settings, slots, selectedTargetIds });
  }

  function addCustomSlot() {
    onChange({
      ...settings,
      slots: [
        ...settings.slots,
        {
          id: getNextSlotId(settings.slots),
          enabled: false,
          name: "自定义 AI",
          url: "",
          presetKey: "custom"
        }
      ]
    });
  }

  function deleteSlot(slotId: string) {
    const slots = settings.slots.filter((slot) => slot.id !== slotId);
    const selectedTargetIds = settings.selectedTargetIds.filter((id) => id !== slotId);
    onChange({ ...settings, slots, selectedTargetIds });
  }

  return (
    <aside className="settings-panel" aria-label="AI 窗口设置">
      <div className="settings-header">
        <h2>AI 窗口设置</h2>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="slot-list">
        {settings.slots.map((slot, index) => (
          <SlotEditor
            key={slot.id}
            slot={slot}
            canDelete={index >= builtInSlotCount}
            disableEnable={!slot.enabled && enabledCount >= maxEnabledSlots}
            onChange={(nextSlot) => updateSlot(index, nextSlot)}
            onDelete={() => deleteSlot(slot.id)}
          />
        ))}
      </div>

      <button type="button" className="secondary-button" onClick={addCustomSlot}>
        添加自定义AI
      </button>

      {!validation.valid && (
        <div className="settings-errors">
          {validation.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <button type="button" className="primary-button" disabled={!validation.valid} onClick={onSave}>
        保存设置
      </button>
    </aside>
  );
}

function SlotEditor({
  slot,
  canDelete,
  disableEnable,
  onChange,
  onDelete
}: {
  slot: AiSlot;
  canDelete: boolean;
  disableEnable: boolean;
  onChange: (slot: AiSlot) => void;
  onDelete: () => void;
}) {
  function applyPreset(value: PresetKey) {
    if (value === "custom") {
      onChange({ ...slot, presetKey: "custom" });
      return;
    }

    const preset = AI_PRESETS[value];
    onChange({
      ...slot,
      name: preset.name,
      url: preset.url,
      presetKey: preset.key
    });
  }

  return (
    <section className="slot-editor">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={slot.enabled}
          disabled={disableEnable}
          onChange={(event) => onChange({ ...slot, enabled: event.target.checked })}
        />
        启用 {slot.id}
      </label>

      <label>
        快捷选项
        <select value={slot.presetKey} onChange={(event) => applyPreset(event.target.value as PresetKey)}>
          {Object.values(AI_PRESETS).map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.name}
            </option>
          ))}
          <option value="custom">自定义</option>
        </select>
      </label>

      <label>
        名称
        <input value={slot.name} onChange={(event) => onChange({ ...slot, name: event.target.value })} />
      </label>

      <label>
        网址
        <input value={slot.url} onChange={(event) => onChange({ ...slot, url: event.target.value })} />
      </label>

      {canDelete && (
        <button type="button" className="danger-button" onClick={onDelete}>
          删除
        </button>
      )}
    </section>
  );
}

function getNextSlotId(slots: AiSlot[]): string {
  const maxSlotNumber = slots.reduce((max, slot) => {
    const match = /^slot-(\d+)$/.exec(slot.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `slot-${maxSlotNumber + 1}`;
}
