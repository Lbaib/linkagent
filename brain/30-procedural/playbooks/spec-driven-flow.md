---
type: playbook
created: 2026-07-25
status: stable
tags: [程序记忆, 手册, 规格]
---

# 手册：规格驱动开发流程（OpenSpec）

> 本项目功能演进遵循 OpenSpec 规格流。工作流定义在 `.agent/workflows/opsx-*.md`，技能在 `.agent/skills/openspec-*/`。

## 何时必须走规格流

- 新增功能能力（capability）
- 改变既有功能的对外行为 / 接口契约
- 不需要：纯重构、修 bug、文档、样式微调

## 流程

1. **探索**（可选）：`opsx-explore` —— 分析现状，明确问题。
2. **提案**：`opsx-propose` —— 在 `openspec/changes/<change-id>/` 生成 proposal.md + 规格增量 + tasks.md。
3. **应用**：`opsx-apply` —— 按 tasks.md 实现代码。
4. **归档**：`opsx-archive` —— 将变更合入 `openspec/specs/` 现行规格，提案移入 `openspec/changes/archive/`。
5. **同步**（如漂移）：`opsx-sync` —— 代码与规格不一致时校准。

## 记忆库联动

- 提案获批后若含架构决策 → 同步写 ADR 到 `10-semantic/decisions/`。
- 归档完成 → 会话日志中记录 change-id，并更新 `10-semantic/domain/` 对应领域知识。

## 现行规格清单

`openspec/specs/`：agent-chat / agent-routing / ai-chat / client-auth（随演进增加，以目录实际内容为准）。

## 相关

[[客服业务域]] · [[session-end]]
