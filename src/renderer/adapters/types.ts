import type { AiSlot } from "../../shared/types.js";

export type SendStatus = "sent" | "manual" | "failed";

export interface PaneSendResult {
  ok: boolean;
  status: SendStatus;
  error?: string;
}

export interface SendResult extends PaneSendResult {
  slotId: string;
}

export interface PaneController {
  send: (message: string) => Promise<PaneSendResult>;
}

export interface SiteAdapter {
  name: string;
  buildSendScript: (message: string, slot: AiSlot) => string;
}
