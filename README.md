# AIPanel

AIPanel 是一个面向 macOS 的多 AI 分屏桌面应用。它把多个 AI 网页放在同一窗口中，让你输入一次消息，再发送到一个或多个已选面板。

## 功能

- 同时显示 3–6 个 AI 网页面板
- 内置 DeepSeek、豆包、Kimi、通义千问、智谱清言、ChatGPT 和 Gemini
- 支持自定义 AI 网站名称与地址
- 每个面板保留独立的本地登录状态
- 可选择全部或部分面板发送消息
- 自动发送失败时保留消息，方便手动粘贴发送

## 安装

在仓库的 Releases 页面下载适合 Mac 的 DMG：

- `mac-arm64`：Apple Silicon（M1/M2/M3/M4 等）
- `mac-x64`：Intel Mac

当前安装包未使用 Apple Developer 证书签名。首次启动若被 macOS 阻止，请在“系统设置 → 隐私与安全性”中确认打开，或在 Finder 中右键应用并选择“打开”。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

## 测试与构建

```bash
npm test
npm run lint
npm run package:mac
```

安装包会输出到 `release-builder/`。Intel Mac 构建可运行 `npm run package:mac:x64`；Windows 构建说明见 [`docs/windows-packaging.md`](docs/windows-packaging.md)。

## 隐私

AIPanel 不调用 AI 提供商 API，也不保存 AI 账号密码。设置和各网页的登录会话保存在本机。使用各 AI 网站时，仍受对应网站的服务条款和隐私政策约束。
