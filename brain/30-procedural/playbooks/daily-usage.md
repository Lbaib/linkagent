---
type: playbook
created: 2026-07-25
status: stable
tags: [程序记忆, 手册, 日常]
---

# 手册：日常怎么用这套脚手架

> 给人看的操作说明。你日常真正要打开的通常只有 Obsidian 的 [[HOME]] / 仪表盘，以及偶尔校正 [[current-focus]]。其余由 AI 维护。

## 你（人类）日常

| 时机 | 你做什么 | AI 做什么 |
|---|---|---|
| 开聊 | 直接提需求即可 | 自动读 current-focus / memory-map（Cursor alwaysApply） |
| 中间有金句 | 说「记一下」或打 `/沉淀` | 写入 `_inbox/` |
| 收工 | 打 `/收尾` 或说「收尾」 | 写会话日志、更新焦点 |
| 攒了一阵 | 打 `/巩固记忆` | 提炼语义、清理 inbox |
| 想浏览 | Obsidian 打开 `brain/` → [[HOME]] / [[收件箱]] | — |

## AI 工具侧

四层机制，从「总是生效」到「按需查阅」：

| 层 | 位置 | 何时生效 |
|---|---|---|
| 规则 | `.cursor/rules/` | 每次会话自动注入（Cursor） |
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
