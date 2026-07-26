---
type: core
created: 2026-07-25
status: evolving
tags: [核心记忆, 术语]
---

# 术语表

> 项目专有名词与内部约定的统一口径。发现新术语随时追加（按拼音/字母排序）。

| 术语 | 含义 |
|---|---|
| **ADR** | Architecture Decision Record，架构决策记录，存于 `10-semantic/decisions/` |
| **防腐层** | `ai-rag-service` 中隔离外部大模型 API 的适配器层，换模型厂商时内部业务零感知 |
| **记忆巩固** | 定期把情景记忆（会话日志）中可复用的知识提炼进语义记忆的过程，见 [[memory-consolidation]] |
| **坐席 / 客服** | 人工客服账号（`SysUser`），有接待量上限（默认 5 人） |
| **转人工双轨制** | 主动触发（用户点按钮）+ 被动触发（AI 置信度低/情绪识别）两种转人工路径 |
| **长短连接隔离** | HTTP 短连接走 `api-gateway`，WebSocket 长连接直连 `chat-server` 独立端口，物理隔离，见 [[ADR-0001-长短连接物理隔离]] |
| **OpenSpec / opsx** | 规格驱动开发工具链：`openspec/` 存规格，`.agent/workflows/opsx-*` 为提案/应用/归档工作流 |
| **RAG** | 检索增强生成：pgvector KNN 召回知识片段 → 拼 Prompt → 大模型生成 |
| **上下文漫游** | 客服接单时自动拉取用户此前与 AI 的完整聊天记录，客户无需复述问题 |
| **Vault** | Obsidian 术语，指 `brain/` 这个记忆库文件夹 |
| **记忆地图** | [[memory-map]]：怎么记、往哪归档的单一真相 |
| **inbox / 收件箱** | `brain/_inbox/`：先捕获再归档的暂存区 |
| **项目总合同** | 仓库根唯一的 `AGENTS.md`：统一声明技术基线、架构约束、目录导向和团队角色 |
| **目录护栏** | `.agents/skills/` 中带 `paths` 的项目私有 Skill，改相关目录时自动加载 |
| **工作记忆 / 情景记忆 / 语义记忆 / 程序记忆 / 核心记忆** | 记忆库五层架构，见 `brain/README.md` |
