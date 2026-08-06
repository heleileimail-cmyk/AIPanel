import type { PaneController, SendResult } from "../adapters/types.js";

interface SendToTargetsInput {
  message: string;
  targetIds: string[];
  controllers: Map<string, PaneController>;
}

export async function sendToTargets({ message, targetIds, controllers }: SendToTargetsInput): Promise<SendResult[]> {
  const results = await Promise.all(
    targetIds.map(async (slotId) => {
      const controller = controllers.get(slotId);

      if (!controller) {
        return {
          slotId,
          ok: false,
          status: "manual" as const,
          error: "窗口还没有准备好。"
        };
      }

      try {
        const result = await controller.send(message);
        return { slotId, ...result };
      } catch (error) {
        return {
          slotId,
          ok: false,
          status: "failed" as const,
          error: error instanceof Error ? error.message : "发送失败。"
        };
      }
    })
  );

  return results;
}
