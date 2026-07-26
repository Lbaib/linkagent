---
type: workflow
created: 2026-07-25
status: stable
tags: [程序记忆, 工作流]
updated: 2026-07-25
---

# 工作流：会话收尾（Session End）

> 实质工作后执行。可用 Cursor 命令 `/收尾`。

## 何时必须

改了代码 / 做了决策 / 产生新认知 → **必须**。纯问答可跳过。

## 步骤

1. **会话日志**：`20-episodic/sessions/YYYY-MM-DD-主题.md`（模板 [[会话日志]]）。写动机，不只列文件。
2. **ADR**：有架构选择 → [[ADR]] 模板写入 `10-semantic/decisions/`。
3. **更新 [[current-focus]]**：状态 / 下一步 / 阻塞。
4. **Inbox**：本会话 `_inbox/` 中可归档的尽快归档；不确定的留下。
5. **清理 [[scratchpad]]**：已固化删除；悬案迁 [[open-questions]]。
6. **地图**：模块/目录变更则更新 [[project-map]]。

## 反模式

- ❌ scratchpad 当日志堆着不清理。
- ❌ 改写历史情景记忆。
- ❌ 在 AGENTS.md / cursor rule 里复制新细则（应写入 [[memory-map]] 或流程文档）。

## 相关

[[session-start]] · [[memory-consolidation]] · [[daily-usage]]
