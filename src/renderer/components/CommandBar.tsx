import type { AiSlot } from "../../shared/types.js";

interface CommandBarProps {
  enabledSlots: AiSlot[];
  selectedTargetIds: string[];
  message: string;
  onMessageChange: (message: string) => void;
  onTargetToggle: (slotId: string) => void;
  onSelectAll: () => void;
  onSend: () => void;
}

export function CommandBar({
  enabledSlots,
  selectedTargetIds,
  message,
  onMessageChange,
  onTargetToggle,
  onSelectAll,
  onSend
}: CommandBarProps) {
  return (
    <section className="command-bar">
      <textarea
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        placeholder="输入要发送给 AI 的消息"
      />
      <div className="target-row">
        <button type="button" onClick={onSelectAll}>
          全选
        </button>
        {enabledSlots.map((slot) => (
          <label key={slot.id} className="target-pill">
            <input
              type="checkbox"
              checked={selectedTargetIds.includes(slot.id)}
              onChange={() => onTargetToggle(slot.id)}
            />
            {slot.name}
          </label>
        ))}
      </div>
      <button
        type="button"
        className="send-button"
        disabled={!message.trim() || selectedTargetIds.length === 0}
        onClick={onSend}
      >
        发送到选中窗口
      </button>
    </section>
  );
}
