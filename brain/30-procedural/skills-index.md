---
type: index
created: 2026-07-25
status: evolving
tags: [程序记忆, 技能]
---

# Skills 索引

> 完整步骤在各 `SKILL.md` 里，本文只做索引与选型说明。新增 skill 时更新此表。

## 项目私有 skills（`.agents/skills/`）

| Skill | 用途 | 触发方式 |
|---|---|---|
| `memory-capture` | 可复用结论 → `brain/_inbox/` | 自动 / `/沉淀` |
| `adr-write` | 架构决策 → `10-semantic/decisions/` | 自动 / 收尾时 |
| `session-wrap` | 会话收尾全流程 | 自动 / `/收尾` |
| `skill-forge` | 把重复套路铸成新 skill | 巩固时 / `/巩固记忆` |
| `ws-contract-check` | WS + JWT 握手契约跨端一致性 | 改 chat-server / common-core / 前端 store 时自动 |
| `rag-guardrails` | 防腐层、pgvector、Prompt 护栏 | 改 ai-rag-service / system-management 时自动 |

后两个带 `paths` 限定，只在相关目录的改动中出现，避免噪音。

## 四种机制怎么选

| 需求 | 用什么 | 位置 |
|---|---|---|
| 每次会话都要遵守 | 规则（保持极简） | `.cursor/rules/` |
| 特定时机自动到场 | **skill** | `.agents/skills/` |
| 用户主动一键触发 | 命令（薄壳，指向 skill） | `.cursor/commands/` |
| 人类要读、AI 偶尔查 | 文档 | `brain/30-procedural/playbooks/` |

## 发现路径（重要）

Cursor 与 Codex 自动扫描的项目级 skill 目录只有：`.agents/skills/`、`.cursor/skills/`、`.claude/skills/`、`.codex/skills/`。

本仓选 **`.agents/skills/`**，因为 Cursor 和 Codex 都认它，覆盖面最广。

⚠️ 已知问题：仓库里 `.agent/skills/`（**单数**）下的 5 个 openspec skill 不在扫描路径上，实际未被加载，目前只能靠 `.agent/workflows/opsx-*.md` 文档指路。详见 `brain/40-working/open-questions.md`。

## 相关

[[memory-map]] · [[memory-consolidation]] · [[daily-usage]]
