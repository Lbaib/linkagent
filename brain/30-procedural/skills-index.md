---
type: index
created: 2026-07-25
updated: 2026-07-27
status: evolving
tags: [程序记忆, 技能]
---

# Skills 索引

> 完整步骤在各 `SKILL.md` 里，本文只做索引与选型说明。新增 skill 时更新此表。

## 治理 / 记忆类（项目私有，优先）

| Skill | 用途 | 触发方式 |
|---|---|---|
| `memory-capture` | 可复用结论 → `brain/_inbox/` | 自动 / `/沉淀` |
| `adr-write` | 架构决策 → `10-semantic/decisions/` | 自动 / 收尾时 |
| `session-wrap` | 会话收尾全流程 | 自动 / `/收尾` |
| `skill-forge` | 把重复套路铸成新 skill | 巩固时 / `/巩固记忆` |
| `agent-entry-sync` | 基线/端口/边界变更时同步根 AGENTS + Skills + brain | 自动（改合同/ADR/基线时） |
| `ws-contract-check` | WS + JWT 握手契约跨端一致性（含 role、Vite `/ws`→8081、token 隔离、转人工幂等） | 改 chat-server / common-core / 前端 store 时自动 |
| `rag-guardrails` | 防腐层、pgvector、Prompt 护栏 | 改 ai-rag-service / system-management 时自动 |

带 `paths` 的后两个只在相关目录改动时出现，避免噪音。`agent-entry-sync` 由首次巩固铸造；`ws-contract-check` 由 [[2026-07-27-二次记忆巩固]] 加厚（未新铸 skill）。

## 设计类（已跟踪，注意稀释）

`banner-design` / `brand` / `design` / `design-system` / `slides` / `ui-styling` / `ui-ux-pro-max` 仍在 `.agents/skills/`，与治理类并列加载。二次巩固仍判定：尚未形成「隔离/降权」的 ≥3 次操作套路，**不铸新 skill、不擅自移走**；见 [[open-questions]]。

## 四种机制怎么选

| 需求 | 用什么 | 位置 |
|---|---|---|
| 每次会话都要遵守 | 规则（保持极简） | `.cursor/rules/` |
| 特定时机自动到场 | **skill** | `.agents/skills/` |
| 用户主动一键触发 | 命令（薄壳，指向 skill） | `.cursor/commands/` |
| 人类要读、AI 偶尔查 | 文档 | `brain/30-procedural/playbooks/` |

## 发现路径（重要）

Cursor 与 Codex 自动扫描：`.agents/skills/`、`.cursor/skills/`、`.claude/skills/`、`.codex/skills/`。本仓治理 Skills 统一在 **`.agents/skills/`**。

⚠️ `.agent/skills/`（单数）下的 openspec skill 仍不在扫描路径；用户决定暂不迁移。

## 相关

[[memory-map]] · [[memory-consolidation]] · [[agent-entry-layering]] · [[daily-usage]] · [[demo-closed-loop-invariants]]
