import { expect, test } from "@playwright/test";

test("renderer shell shows command bar and default AI slots", async ({ page }) => {
  await page.addInitScript(() => {
    window.multiAi = {
      version: "0.1.0",
      loadSettings: async () => ({
        slots: [
          {
            id: "slot-1",
            enabled: true,
            name: "DeepSeek",
            url: "https://chat.deepseek.com/",
            presetKey: "deepseek"
          },
          {
            id: "slot-2",
            enabled: true,
            name: "豆包",
            url: "https://www.doubao.com/chat/",
            presetKey: "doubao"
          },
          {
            id: "slot-3",
            enabled: true,
            name: "Kimi",
            url: "https://kimi.moonshot.cn/",
            presetKey: "kimi"
          },
          {
            id: "slot-4",
            enabled: false,
            name: "通义千问",
            url: "https://tongyi.aliyun.com/qianwen/",
            presetKey: "tongyi"
          },
          {
            id: "slot-5",
            enabled: false,
            name: "智谱清言",
            url: "https://chatglm.cn/",
            presetKey: "zhipu"
          },
          {
            id: "slot-6",
            enabled: false,
            name: "ChatGPT",
            url: "https://chatgpt.com/",
            presetKey: "chatgpt"
          },
          {
            id: "slot-7",
            enabled: false,
            name: "Google Gemini",
            url: "https://gemini.google.com/",
            presetKey: "gemini"
          }
        ],
        selectedTargetIds: ["slot-1", "slot-2", "slot-3"]
      }),
      saveSettings: async (settings) => settings,
      writeClipboardText: async () => true
    };
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "AIPanel" })).toBeVisible();
  await expect(page.getByPlaceholder("输入要发送给 AI 的消息")).toBeVisible();
  await expect(page.getByLabel("DeepSeek").first()).toBeVisible();
  await expect(page.getByLabel("豆包").first()).toBeVisible();
  await expect(page.getByLabel("Kimi").first()).toBeVisible();

  const commandBarBox = await page.locator(".command-bar").boundingBox();
  const paneGridBox = await page.locator(".pane-grid").boundingBox();
  expect(commandBarBox?.y).toBeGreaterThan(paneGridBox?.y ?? 0);

  const messageInput = page.getByPlaceholder("输入要发送给 AI 的消息");
  const sendButton = page.getByRole("button", { name: "发送到选中窗口" });
  await messageInput.fill("测试按钮 hover");
  await sendButton.hover();
  await expect(sendButton).toHaveCSS("background-color", "rgb(37, 99, 235)");

  await page.getByRole("button", { name: "设置" }).click();
  await page.getByRole("button", { name: "添加自定义AI" }).click();
  await expect(page.getByLabel("启用 slot-8")).toBeVisible();
  await expect(page.locator(".slot-editor").last().locator("input").nth(1)).toHaveValue("自定义 AI");
});
