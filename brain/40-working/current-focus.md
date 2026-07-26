---
type: working
updated: 2026-07-26
tags: [工作记忆, 焦点]
---

# 当前焦点

> 每次会话收尾时更新。这是新会话的第一个必读文件。

## 当前状态

- ✅ 记忆脚手架 v1→v4 已建并入库。
- ✅ 首次巩固完成；`agent-entry-sync` 已铸造。
- ✅ Cursor Hooks：`sessionStart` / `sessionEnd`（含关键片段栏）→ [[ADR-0007-Cursor-Hooks自动注入与候选留底]]
- ✅ 沉淀标准升级：`memory-capture` 区分 Correction / Decision / Debug / Insight / Pattern；规则增加克制版认知检查点
- 业务代码仍有大量未提交改动，与脚手架分开看待。

## 下一步（按优先级）

1. **验证 Hooks + 检查点**：新开会话看焦点注入；故意纠正一次 AI 后看是否写入 `_inbox/`；关会话看 `_inbox/auto/` 是否有「关键片段」栏。
2. 待决：设计 skills 稀释、根 `.gitignore`/`target/`、openspec 迁移、DocumentController——见 [[open-questions]]。
3. 日常：开聊即可；结束可依赖 auto 留底；实质工作仍建议 `/收尾`。

## 阻塞点

- Hooks 依赖本机 PATH 中的 `node`；若未触发，检查 Hooks 输出通道。

## 相关

[[scratchpad]] · [[open-questions]] · [[daily-usage]] · [[HOME]]
