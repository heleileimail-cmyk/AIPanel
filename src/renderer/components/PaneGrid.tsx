import type { RefObject } from "react";

import type { AiSlot } from "../../shared/types.js";
import type { PaneController } from "../adapters/types.js";
import { WebPane } from "./WebPane.js";

interface PaneGridProps {
  enabledSlots: AiSlot[];
  selectedTargetIds: string[];
  paneRefs: Map<string, RefObject<PaneController | null>>;
  onTargetToggle: (slotId: string) => void;
}

export function PaneGrid({ enabledSlots, selectedTargetIds, paneRefs, onTargetToggle }: PaneGridProps) {
  return (
    <section className={`pane-grid pane-count-${enabledSlots.length}`}>
      {enabledSlots.map((slot) => (
        <WebPane
          key={slot.id}
          ref={paneRefs.get(slot.id)}
          slot={slot}
          selected={selectedTargetIds.includes(slot.id)}
          onSelect={() => onTargetToggle(slot.id)}
        />
      ))}
    </section>
  );
}
