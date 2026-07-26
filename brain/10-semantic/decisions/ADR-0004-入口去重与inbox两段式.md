---
type: adr
id: ADR-0004
created: 2026-07-25
status: accepted
tags: [语义记忆, 决策, 记忆库]
---

# ADR-0004：入口去重 + inbox 两段式 + 模块嵌套 AGENTS

## 状态

accepted（补充 [[ADR-0003-Git内嵌Obsidian记忆库]]，不取代）

## 背景

初版脚手架把记忆协议同时写在根 `AGENTS.md` 与 `.cursor/rules/memory-protocol.mdc`，易双份漂移；笔记要求当场分入五层，捕获摩擦大；代码目录缺少反向指针，改模块时架构约束不会自动到场。对照独立 companion 仓的成熟做法后升级。

## 决策

1. **一套真相、两扇门**：细则只在 `brain/00-core/`（尤其 [[memory-map]]）；`AGENTS.md` 与 cursor rule 仅索引。
2. **默认 `_inbox/` 再归档**：捕获与分类分离。
3. **模块嵌套 `AGENTS.md`**：`chat-server` / `customer-service` / `ai-rag-service` / `api-gateway` / `system-management` / `linkedagent-frontend`。
4. **Cursor 斜杠命令**：`/收尾` `/沉淀` `/巩固记忆` `/回顾进度`，降低对 AI 自觉收尾的依赖。
5. **Obsidian Vault 仍为 `brain/`**：避免仓库根代码与 `.agents/skills` 污染图谱；代码用相对路径锚点给 AI 跳转。

## 后果

- ✅ 防漂移、捕获更快、改代码时约束就近生效、日常操作可命令化。
- ⚠️ Obsidian 内仍无法一键打开 vault 外源码（接受）。
- ⚠️ 嵌套 AGENTS 需随模块演进偶尔更新。

## 相关

[[memory-map]] · [[daily-usage]] · [[ADR-0003-Git内嵌Obsidian记忆库]]
