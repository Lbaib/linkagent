---
type: adr
id: ADR-0003
created: 2026-07-25
status: accepted
tags: [语义记忆, 决策, 记忆库]
---

# ADR-0003：AI 记忆库采用 Git 内嵌 Obsidian Vault + 分层记忆架构

## 状态

accepted

## 背景

需要为「LinkAgent 架构师伙伴」建立跨会话、跨工具（Cursor / Codex / Antigravity）的长期记忆。备选方案：

1. 外部记忆服务（mem0 / Zep 等托管记忆 API）
2. 向量数据库存对话 embedding
3. **纯 Markdown 文件库，Git 版本化，Obsidian 可视化**

## 决策

选方案 3：在仓库内建 `brain/` Obsidian Vault，按认知科学五层记忆架构组织（核心/语义/情景/程序/工作记忆），以根目录 `AGENTS.md` + `.cursor/rules/memory-protocol.mdc` 作为各 AI 工具的统一注入入口。

## 理由

- **工具无关**：任何能读文件的代理都能用，不锁定单一厂商；换模型不丢记忆。
- **人机同读**：人类用 Obsidian 图谱/双链浏览，AI 用文件读写，同一份真相。
- **免运维、可审计**：Git 即备份与历史，diff 即记忆变更审计日志。
- **上下文效率**：分层 + 协议化读取（启动只读 current-focus + 宪法），避免每次会话灌入全量记忆。

## 后果

- ✅ 零外部依赖，随仓库克隆即完整迁移。
- ⚠️ 检索靠文件名/双链/grep，无语义向量检索；记忆规模膨胀后需依赖 [[memory-consolidation|记忆巩固]] 流程控制熵增。
- ⚠️ 依赖代理自觉遵守协议；靠 alwaysApply 规则与 AGENTS.md 强化。

## 相关

`AGENTS.md` · `brain/README.md` · [[memory-consolidation]]
