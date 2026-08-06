import { createElement, forwardRef, useImperativeHandle, useRef } from "react";

import type { AiSlot } from "../../shared/types.js";
import { getAdapterForSlot } from "../adapters/presetAdapters.js";
import type { PaneController, PaneSendResult } from "../adapters/types.js";

interface WebPaneProps {
  slot: AiSlot;
  selected: boolean;
  onSelect: () => void;
}

type WebviewElement = HTMLElement & {
  reload: () => void;
  executeJavaScript: (code: string, userGesture?: boolean) => Promise<unknown>;
};

export const WebPane = forwardRef<PaneController, WebPaneProps>(function WebPane({ slot, selected, onSelect }, ref) {
  const webviewRef = useRef<WebviewElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      async send(message: string): Promise<PaneSendResult> {
        const webview = webviewRef.current;
        if (!webview) {
          return { ok: false, status: "manual", error: "窗口还没有准备好。" };
        }

        const adapter = getAdapterForSlot(slot);
        const script = adapter.buildSendScript(message, slot);
        const result = await webview.executeJavaScript(script, true);
        return result as PaneSendResult;
      }
    }),
    [slot]
  );

  return (
    <article className={`web-pane ${selected ? "web-pane-selected" : ""}`}>
      <header className="web-pane-header">
        <label>
          <input type="checkbox" checked={selected} onChange={onSelect} />
          <span>{slot.name}</span>
        </label>
        <button type="button" onClick={() => webviewRef.current?.reload()}>
          刷新
        </button>
      </header>
      {createElement("webview", {
        ref: webviewRef,
        className: "webview",
        src: slot.url,
        partition: `persist:${slot.id}`
      })}
    </article>
  );
});
