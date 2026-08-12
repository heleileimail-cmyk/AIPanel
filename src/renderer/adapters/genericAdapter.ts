import type { SiteAdapter } from "./types.js";

export function buildGenericSendScript(message: string): string {
  const serializedMessage = JSON.stringify(message);

  return `
    (async () => {
      const message = ${serializedMessage};
      const lower = (value) => String(value || "").toLowerCase();
      const unique = (items) => [...new Set(items.filter(Boolean))];
      const descriptorFor = (element) => lower([
        element.textContent,
        element.getAttribute?.("aria-label"),
        element.getAttribute?.("title"),
        element.getAttribute?.("data-testid"),
        element.getAttribute?.("data-test-id"),
        element.getAttribute?.("class"),
        element.id,
        element.querySelector?.("svg title")?.textContent
      ].filter(Boolean).join(" "));
      const positivePattern = /(send|submit|发送|提交|arrow-up|paper-plane|paperplane)/;
      const negativePattern = /(login|登录|refresh|刷新|new|新对话|download|下载|more|更多|plus|add|附件|attach|upload|上传|mic|voice|语音|麦克风|model|模式|ppt)/;
      const isDisabled = (element) =>
        element.disabled ||
        element.getAttribute?.("aria-disabled") === "true" ||
        element.getAttribute?.("disabled") !== null;
      const isHidden = (element) => {
        const style = window.getComputedStyle(element);
        return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
      };
      const readInputText = (element) => ("value" in element ? element.value : element.textContent || "");
      const emitInputEvents = (element, inputType, data) => {
        try {
          element.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType, data }));
        } catch {
          element.dispatchEvent(new Event("beforeinput", { bubbles: true, cancelable: true }));
        }
        try {
          element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType, data }));
        } catch {
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };
      const selectEditableContents = (element) => {
        const selection = window.getSelection?.();
        if (!selection) return false;

        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      };
      const replaceInputText = (element) => {
        element.focus();

        if ("value" in element) {
          element.select?.();
          emitInputEvents(element, "deleteContentBackward", null);
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
          if (setter) {
            setter.call(element, message);
          } else {
            element.value = message;
          }
          emitInputEvents(element, "insertText", message);
          element.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }

        selectEditableContents(element);
        let insertedWithEditor = false;
        if (typeof document.execCommand === "function") {
          try {
            insertedWithEditor = document.execCommand("insertText", false, message);
          } catch {
            insertedWithEditor = false;
          }
        }

        if (!insertedWithEditor || readInputText(element).trim() !== message.trim()) {
          element.textContent = message;
          emitInputEvents(element, "insertReplacementText", null);
        }
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };

      const candidates = [
        document.activeElement,
        ...document.querySelectorAll("textarea"),
        ...document.querySelectorAll('[contenteditable="true"]'),
        ...document.querySelectorAll('[role="textbox"]')
      ].filter(Boolean);

      const input = candidates.find((element) => {
        const tag = element.tagName?.toLowerCase();
        return tag === "textarea" || element.getAttribute("contenteditable") === "true" || element.getAttribute("role") === "textbox";
      });

      if (!input) {
        return { ok: false, status: "manual", error: "没有找到可输入区域。" };
      }

      replaceInputText(input);

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const containers = [];
      for (let element = input; element && containers.length < 7; element = element.parentElement) {
        containers.push(element);
      }
      const nearestForm = input.closest?.("form, [role='form']");
      if (nearestForm) containers.unshift(nearestForm);

      const scopedButtons = containers.flatMap((container) => [
        ...container.querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")
      ]);
      const buttons = unique([
        ...scopedButtons,
        ...document.querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")
      ]).filter((button) => !isDisabled(button) && !isHidden(button));

      const inputRect = input.getBoundingClientRect();
      const scoreButton = (button) => {
        const descriptor = descriptorFor(button);
        const explicitSend = positivePattern.test(descriptor) || button.getAttribute?.("type") === "submit";
        if (!explicitSend && negativePattern.test(descriptor)) return -100;
        if (!explicitSend && button.textContent?.trim()) return -100;

        let score = 0;
        if (positivePattern.test(descriptor)) score += 120;
        if (button.getAttribute?.("type") === "submit") score += 100;
        if (scopedButtons.includes(button)) score += 35;
        if (!button.textContent?.trim() && button.querySelector?.("svg")) score += 35;

        const rect = button.getBoundingClientRect();
        const hasGeometry = rect.width > 0 || rect.height > 0 || inputRect.width > 0 || inputRect.height > 0;
        if (hasGeometry) {
          const buttonCenterX = rect.left + rect.width / 2;
          const buttonCenterY = rect.top + rect.height / 2;
          const inputCenterY = inputRect.top + inputRect.height / 2;
          if (buttonCenterX >= inputRect.left && buttonCenterX <= inputRect.right + 180) score += 20;
          if (Math.abs(buttonCenterY - inputCenterY) <= Math.max(inputRect.height, 64)) score += 20;
          if (buttonCenterX >= inputRect.left + inputRect.width * 0.65) score += 20;
          score += Math.max(0, buttonCenterX - inputRect.left) / Math.max(inputRect.width, 1) * 25;
        }

        return score;
      };

      const [sendButton] = buttons
        .map((button) => ({ button, score: scoreButton(button) }))
        .filter((item) => item.score >= 50)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.button);

      const pressEnterToSend = () => {
        const eventInit = { key: "Enter", code: "Enter", bubbles: true, cancelable: true };
        const handled = !input.dispatchEvent(new KeyboardEvent("keydown", eventInit));
        input.dispatchEvent(new KeyboardEvent("keypress", eventInit));
        input.dispatchEvent(new KeyboardEvent("keyup", eventInit));
        return handled;
      };

      if (!sendButton) {
        if (pressEnterToSend()) {
          return { ok: true, status: "sent" };
        }

        return { ok: false, status: "manual", error: "已填入消息，请手动点击发送。" };
      }

      sendButton.click();
      return { ok: true, status: "sent" };
    })();
  `;
}

export const genericAdapter: SiteAdapter = {
  name: "Generic",
  buildSendScript: (message) => buildGenericSendScript(message)
};
