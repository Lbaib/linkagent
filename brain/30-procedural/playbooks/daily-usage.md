---
type: playbook
created: 2026-07-25
status: stable
tags: [程序记忆, 手册, 日常]
---

# 手册：日常怎么用这套脚手架

> 给人看的操作说明。你日常真正要打开的通常只有 Obsidian 的 [[HOME]] / 仪表盘，以及偶尔校正 [[current-focus]]。其余由 AI 维护。

## 你（人类）日常

| 时机 | 你做什么 | 系统 / AI 做什么 |
|---|---|---|
| 开聊 | 直接提需求即可 | Cursor `sessionStart` hook 自动注入 current-focus；规则仍会指向记忆地图 |
| 中间有金句 | 说「记一下」或打 `/沉淀` | 写入 `_inbox/` |
| 关掉会话 | 可什么都不做 | Cursor `sessionEnd` hook 在 `_inbox/auto/` 落**候选记录**（不是正式日志） |
| 收工整理 | 打 `/收尾` 或说「收尾」 | 写正式会话日志、更新焦点；可顺手清理对应 auto 候选 |
| 攒了一阵 | 打 `/巩固记忆` | 提炼语义、铸造 skill、清理 inbox |
| 想浏览 | Obsidian 打开 `brain/` → [[HOME]] / [[收件箱]] | — |

> Cursor Commands（`/收尾` 等）仍是**语义整理**入口。自动 hook 只保证「开场有焦点、结束有底稿」，不代替 ADR/日志质量。

## AI 工具侧

四层机制，从「总是生效」到「按需查阅」：

| 层 | 位置 | 何时生效 |
|---|---|---|
| 规则 | `.cursor/rules/` | 每次会话自动注入（Cursor） |
| **Hooks** | `.cursor/hooks.json` | `sessionStart` 注入焦点；`sessionEnd` 写 `_inbox/auto/` 候选 |
| 项目总合同 | 根 `AGENTS.md` | 所有工具、所有目录统一生效 |
| **Skills** | `.agents/skills/` | 模型按情境自动选用，或 `/skill-name` 手动调 |
| 命令 | `.cursor/commands/` | 你打 `/收尾` 等主动触发（薄壳，指向 skill） |
| 文档 | `brain/30-procedural/` | 人类查阅，AI 按需读 |

- **Codex / Antigravity**：读根目录 `AGENTS.md`；`.agents/skills/` 同样被 Codex 扫描。
- **新增 skill 后需重开会话**才会加载。
- skill 清单见 [[skills-index]]。

## Obsidian

1. 「打开文件夹」选 **`brain/`**（不要选仓库根，避免代码与 skills 污染图谱）。
2. 建议启用社区插件 **Dataview**；核心插件 **模板（Templates）** 已配置为 `_templates/`。不要求 Templater。
3. 代码路径在笔记里以仓库相对路径写出，给 AI 跳转用；Obsidian 内默认点不开 vault 外文件——这是刻意取舍。

## 相关

[[memory-map]] · [[session-start]] · [[session-end]]
