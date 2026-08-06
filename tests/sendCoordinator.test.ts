import { describe, expect, it, vi } from "vitest";

import type { PaneController } from "../src/renderer/adapters/types";
import { sendToTargets } from "../src/renderer/lib/sendCoordinator";

describe("send coordinator", () => {
  it("sends only to selected pane controllers", async () => {
    const controllers = new Map<string, PaneController>([
      ["slot-1", { send: vi.fn().mockResolvedValue({ ok: true, status: "sent" }) }],
      ["slot-2", { send: vi.fn().mockResolvedValue({ ok: true, status: "sent" }) }],
      ["slot-3", { send: vi.fn().mockResolvedValue({ ok: true, status: "sent" }) }]
    ]);

    const results = await sendToTargets({
      message: "compare this",
      targetIds: ["slot-1", "slot-3"],
      controllers
    });

    expect(results).toEqual([
      { slotId: "slot-1", ok: true, status: "sent" },
      { slotId: "slot-3", ok: true, status: "sent" }
    ]);
    expect(controllers.get("slot-2")?.send).not.toHaveBeenCalled();
  });

  it("records a missing controller as manual fallback", async () => {
    const results = await sendToTargets({
      message: "hello",
      targetIds: ["slot-9"],
      controllers: new Map()
    });

    expect(results).toEqual([{ slotId: "slot-9", ok: false, status: "manual", error: "窗口还没有准备好。" }]);
  });
});
