import { describe, expect, it } from "vitest";

import { buildGenericSendScript } from "../src/renderer/adapters/genericAdapter";
import { getAdapterForSlot } from "../src/renderer/adapters/presetAdapters";
import type { AiSlot } from "../src/shared/types";

describe("send adapters", () => {
  it("escapes message content in generated scripts", () => {
    const script = buildGenericSendScript('hello "AI"\nnext');

    expect(script).toContain(String.raw`hello \"AI\"\nnext`);
  });

  it("clicks an icon-only send button near the message input", async () => {
    document.body.innerHTML = `
      <main>
        <button>新对话</button>
        <section class="composer">
          <textarea aria-label="发消息"></textarea>
          <button type="button" class="send-icon">
            <svg aria-hidden="true"></svg>
          </button>
        </section>
      </main>
    `;
    let sentMessage = "";
    document.querySelector(".send-icon")?.addEventListener("click", () => {
      sentMessage = document.querySelector("textarea")?.value ?? "";
    });

    const result = (await eval(buildGenericSendScript("帮我对比一下"))) as { ok: boolean; status: string };

    expect(result).toEqual({ ok: true, status: "sent" });
    expect(sentMessage).toBe("帮我对比一下");
  });

  it("prefers the right-side icon button when a composer has several icon buttons", async () => {
    document.body.innerHTML = `
      <section class="composer">
        <button type="button" class="tool-icon"><svg aria-hidden="true"></svg></button>
        <textarea aria-label="发消息"></textarea>
        <button type="button" class="tool-icon"><svg aria-hidden="true"></svg></button>
      </section>
    `;
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const [leftButton, rightButton] = [...document.querySelectorAll("button")];
    textarea.getBoundingClientRect = () => ({ left: 40, right: 440, top: 20, bottom: 80, width: 400, height: 60, x: 40, y: 20, toJSON: () => ({}) });
    leftButton.getBoundingClientRect = () => ({ left: 8, right: 32, top: 38, bottom: 62, width: 24, height: 24, x: 8, y: 38, toJSON: () => ({}) });
    rightButton.getBoundingClientRect = () => ({ left: 404, right: 428, top: 38, bottom: 62, width: 24, height: 24, x: 404, y: 38, toJSON: () => ({}) });
    const clicks: string[] = [];
    leftButton.addEventListener("click", () => clicks.push("left"));
    rightButton.addEventListener("click", () => clicks.push("right"));

    const result = (await eval(buildGenericSendScript("继续"))) as { ok: boolean; status: string };

    expect(result).toEqual({ ok: true, status: "sent" });
    expect(clicks).toEqual(["right"]);
  });

  it("chooses the rightmost composer icon when attachment and send buttons are both near the input", async () => {
    document.body.innerHTML = `
      <section class="composer">
        <textarea placeholder="给 DeepSeek 发送消息"></textarea>
        <div role="button" class="_a111 ds-icon-button"><svg aria-hidden="true"></svg></div>
        <div role="button" class="_b222 ds-icon-button"><svg aria-hidden="true"></svg></div>
      </section>
    `;
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const [attachmentButton, sendButton] = [...document.querySelectorAll('[role="button"]')] as HTMLElement[];
    textarea.getBoundingClientRect = () => ({ left: 33, right: 432, top: 318, bottom: 378, width: 399, height: 60, x: 33, y: 318, toJSON: () => ({}) });
    attachmentButton.getBoundingClientRect = () => ({ left: 342, right: 376, top: 390, bottom: 424, width: 34, height: 34, x: 342, y: 390, toJSON: () => ({}) });
    sendButton.getBoundingClientRect = () => ({ left: 386, right: 420, top: 390, bottom: 424, width: 34, height: 34, x: 386, y: 390, toJSON: () => ({}) });
    const clicks: string[] = [];
    attachmentButton.addEventListener("click", () => clicks.push("attachment"));
    sendButton.addEventListener("click", () => clicks.push("send"));

    const result = (await eval(buildGenericSendScript("DeepSeek 自动发送测试"))) as { ok: boolean; status: string };

    expect(result).toEqual({ ok: true, status: "sent" });
    expect(clicks).toEqual(["send"]);
  });

  it("falls back to Enter when the page handles keyboard sending", async () => {
    document.body.innerHTML = `<div role="textbox" contenteditable="true"></div>`;
    const textbox = document.querySelector('[role="textbox"]') as HTMLElement;
    let sentMessage = "";
    textbox.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sentMessage = textbox.textContent ?? "";
      }
    });

    const result = (await eval(buildGenericSendScript("用回车发送"))) as { ok: boolean; status: string };

    expect(result).toEqual({ ok: true, status: "sent" });
    expect(sentMessage).toBe("用回车发送");
  });

  it("uses editor insertion before clicking a send button that starts disabled", async () => {
    document.body.innerHTML = `
      <section class="composer">
        <div role="textbox" contenteditable="true"></div>
        <div role="button" class="assistant-mode"><svg aria-hidden="true"></svg><span>HappyHorse</span></div>
        <button type="button" aria-disabled="true" disabled>发送消息</button>
      </section>
    `;
    const textbox = document.querySelector('[role="textbox"]') as HTMLElement;
    const assistantMode = document.querySelector(".assistant-mode") as HTMLElement;
    const sendButton = document.querySelector("button") as HTMLButtonElement;
    textbox.getBoundingClientRect = () => ({ left: 20, right: 420, top: 320, bottom: 380, width: 400, height: 60, x: 20, y: 320, toJSON: () => ({}) });
    assistantMode.getBoundingClientRect = () => ({ left: 310, right: 380, top: 390, bottom: 424, width: 70, height: 34, x: 310, y: 390, toJSON: () => ({}) });
    sendButton.getBoundingClientRect = () => ({ left: 386, right: 420, top: 390, bottom: 424, width: 34, height: 34, x: 386, y: 390, toJSON: () => ({}) });
    const clicks: string[] = [];
    assistantMode.addEventListener("click", () => clicks.push("assistant-mode"));
    sendButton.addEventListener("click", () => clicks.push("send"));
    const originalExecCommand = document.execCommand;
    document.execCommand = ((command: string, _showUi?: boolean, value?: string) => {
      if (command !== "insertText") return false;
      textbox.textContent = value ?? "";
      textbox.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value ?? "" }));
      sendButton.disabled = false;
      sendButton.setAttribute("aria-disabled", "false");
      return true;
    }) as typeof document.execCommand;

    const result = (await eval(buildGenericSendScript("第二轮继续问"))) as { ok: boolean; status: string };

    document.execCommand = originalExecCommand;
    expect(result).toEqual({ ok: true, status: "sent" });
    expect(clicks).toEqual(["send"]);
  });

  it("uses preset adapters for built-in slots", () => {
    const slot: AiSlot = {
      id: "slot-1",
      enabled: true,
      name: "DeepSeek",
      url: "https://chat.deepseek.com/",
      presetKey: "deepseek"
    };

    expect(getAdapterForSlot(slot).name).toBe("DeepSeek");
  });

  it("uses the generic adapter for custom slots", () => {
    const slot: AiSlot = {
      id: "slot-4",
      enabled: true,
      name: "Custom",
      url: "https://example.com/chat",
      presetKey: "custom"
    };

    expect(getAdapterForSlot(slot).name).toBe("Generic");
  });
});
