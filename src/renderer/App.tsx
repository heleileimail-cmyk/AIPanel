import { createRef, useEffect, useMemo, useState } from "react";

import { createDefaultSettings } from "../shared/settingsValidation.js";
import type { AppSettings } from "../shared/types.js";
import type { PaneController, SendResult } from "./adapters/types.js";
import { CommandBar } from "./components/CommandBar.js";
import { PaneGrid } from "./components/PaneGrid.js";
import { SettingsPanel } from "./components/SettingsPanel.js";
import { loadSettings, saveSettings, writeClipboardText } from "./lib/settings.js";
import { sendToTargets } from "./lib/sendCoordinator.js";

const maxSelectableTargets = 6;

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => createDefaultSettings());
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>(settings.selectedTargetIds);
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);

  const enabledSlots = useMemo(() => settings.slots.filter((slot) => slot.enabled), [settings.slots]);
  const paneRefs = useMemo(
    () => new Map(enabledSlots.map((slot) => [slot.id, createRef<PaneController>()])),
    [enabledSlots]
  );

  useEffect(() => {
    void loadSettings().then((loaded) => {
      setSettings(loaded);
      setSelectedTargetIds(loaded.selectedTargetIds);
    });
  }, []);

  function toggleTarget(slotId: string) {
    setSelectedTargetIds((current) =>
      current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : current.length >= maxSelectableTargets
          ? current
          : [...current, slotId]
    );
  }

  function selectAllTargets() {
    setSelectedTargetIds(enabledSlots.slice(0, maxSelectableTargets).map((slot) => slot.id));
  }

  async function persistSettings() {
    const saved = await saveSettings({
      ...settings,
      selectedTargetIds: selectedTargetIds.filter((id) => settings.slots.some((slot) => slot.id === id && slot.enabled))
    });
    setSettings(saved);
    setSelectedTargetIds(saved.selectedTargetIds);
    setSettingsOpen(false);
  }

  async function sendMessage() {
    const controllers = new Map<string, PaneController>();
    for (const [slotId, ref] of paneRefs) {
      if (ref.current) controllers.set(slotId, ref.current);
    }

    const results = await sendToTargets({
      message,
      targetIds: selectedTargetIds,
      controllers
    });
    setSendResults(results);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>AIPanel</h1>
          <p>3-6 个 AI 网页窗口，一次输入，按选择发送。</p>
        </div>
        <button type="button" onClick={() => setSettingsOpen(true)}>
          设置
        </button>
      </header>

      <PaneGrid
        enabledSlots={enabledSlots}
        selectedTargetIds={selectedTargetIds}
        paneRefs={paneRefs}
        onTargetToggle={toggleTarget}
      />

      {sendResults.length > 0 && (
        <section className="send-status">
          {sendResults.map((result) => (
            <span key={result.slotId} className={`send-status-item send-status-${result.status}`}>
              {result.slotId}: {result.status}
              {result.error ? ` - ${result.error}` : ""}
            </span>
          ))}
          {sendResults.some((result) => !result.ok) && (
            <button type="button" className="copy-fallback-button" onClick={() => void writeClipboardText(message)}>
              复制本轮消息
            </button>
          )}
        </section>
      )}

      <CommandBar
        enabledSlots={enabledSlots}
        selectedTargetIds={selectedTargetIds}
        message={message}
        onMessageChange={setMessage}
        onTargetToggle={toggleTarget}
        onSelectAll={selectAllTargets}
        onSend={sendMessage}
      />

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onSave={persistSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
