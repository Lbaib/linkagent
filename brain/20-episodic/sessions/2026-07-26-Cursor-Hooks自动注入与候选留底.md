---
type: session
created: 2026-07-26
tool: cursor
tags: [情景记忆, 会话日志, hooks]
---

# 2026-07-26 · Cursor Hooks 自动注入与候选留底

## 目标

解决「命令依赖手动触发」的 Cursor 侧缺口：会话启动自动注入焦点；会话结束自动写候选记录。

## 做了什么

1. 新增 `.cursor/hooks.json` + `session-start.js` / `session-end.js`（Node，fail-open）。
2. `sessionStart` 注入 `current-focus` 与待决摘录。
3. `sessionEnd` 写入 `brain/_inbox/auto/` 候选（跳过 background、<8s 会话）；含 git 摘要与 transcript 路径字段。
4. 文档 / ADR-0007 / daily-usage / AGENTS / memory-protocol 同步。
5. 本地冒烟：start 返回 `additional_context`；end 落盘成功。

## 关键决策

- [[ADR-0007-Cursor-Hooks自动注入与候选留底]]

## 遗留

- 需在真实 Composer 新会话中验证 Hooks 面板是否加载。
- 未提交 Git（等用户确认）。
- 跨 Agent / Git 提交前检查、定时巩固仍未做。
