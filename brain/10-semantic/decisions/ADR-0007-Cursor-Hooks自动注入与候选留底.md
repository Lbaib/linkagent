---
type: adr
id: ADR-0007
created: 2026-07-26
status: accepted
tags: [语义记忆, 决策, 记忆库, cursor-hooks]
---

# ADR-0007：Cursor sessionStart 自动注入 + sessionEnd 自动候选留底

## 状态

accepted

## 背景

记忆脚手架已解决「记忆放哪里」，但 `/沉淀` `/收尾` `/巩固记忆` 依赖人工触发。换会话或忘记命令时，焦点不会自动进入上下文，会话经验也可能蒸发。需要在 **不夸大全自动语义记忆** 的前提下，把 Cursor 侧最关键的两步自动化。

## 决策

1. 使用项目级 Cursor Hooks（`.cursor/hooks.json`）。
2. **`sessionStart`** → `node .cursor/hooks/session-start.js`：把 `current-focus.md` 与待决问题摘录注入 `additional_context`。
3. **`sessionEnd`** → `node .cursor/hooks/session-end.js`：在 `brain/_inbox/auto/` 写入**候选记录**（元数据 + git 摘要 + transcript 路径），不代替正式会话日志。
4. 脚本 **fail-open**：失败不阻断会话创建/结束。
5. 斜杠命令保留为人工语义整理入口；巩固仍按周期/手动触发。

## 理由

- `sessionStart.additional_context` 是官方支持的开场注入，不依赖模型自觉去读文件。
- `sessionEnd` 无法向 Agent 注入 follow-up，但适合旁路落盘，满足「至少留底」。
- 候选记录与正式日志分离，避免把粗糙自动文本写进只追加的情景记忆。

## 后果

- ✅ 新 Composer 会话默认带上当前焦点。
- ✅ 会话结束有可审计候选文件，降低遗忘收尾的损失。
- ✅ 候选含「关键片段」栏（有 transcript 时自动摘录并脱敏）；配合 `memory-capture` 的 Correction/Decision 类型做人工提炼。
- ⚠️ 仅覆盖 **Cursor IDE Composer**；Cloud Agent 不支持这组生命周期 Hook。
- ⚠️ 依赖本机 `node` 在 PATH 中；需在 Cursor Hooks 面板确认已加载。
- ⚠️ `auto/` 可能产生噪音文件（已跳过 <8s 会话与 background agent）；仍需人工清理/收尾。
- ⚠️ transcript 路径仅在 Cursor 启用 transcripts 时可用；未启用则片段栏提示缺失。

## 相关

`.cursor/hooks.json` · [[daily-usage]] · [[ADR-0005-项目私有skills与铸造管线]]
