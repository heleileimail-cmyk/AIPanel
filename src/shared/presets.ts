import type { AiPreset } from "./types.js";

export const AI_PRESETS = {
  deepseek: {
    key: "deepseek",
    name: "DeepSeek",
    url: "https://chat.deepseek.com/"
  },
  doubao: {
    key: "doubao",
    name: "豆包",
    url: "https://www.doubao.com/chat/"
  },
  kimi: {
    key: "kimi",
    name: "Kimi",
    url: "https://kimi.moonshot.cn/"
  },
  tongyi: {
    key: "tongyi",
    name: "通义千问",
    url: "https://tongyi.aliyun.com/qianwen/"
  },
  zhipu: {
    key: "zhipu",
    name: "智谱清言",
    url: "https://chatglm.cn/"
  },
  chatgpt: {
    key: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com/"
  },
  gemini: {
    key: "gemini",
    name: "Google Gemini",
    url: "https://gemini.google.com/"
  }
} as const satisfies Record<string, AiPreset>;
