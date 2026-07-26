---
name: agent-entry-sync
description: 在变更技术基线、端口、服务边界或 Agent 入口约定时，同步根 AGENTS.md、相关 Skills 与 brain 指针，禁止再创建嵌套 AGENTS.md 或把长细则复制进 cursor rule。当用户改 JDK/Spring/端口、写架构 ADR、或说「更新项目合同」「同步 AGENTS」「入口分层」时使用。
---

# agent-entry-sync — 项目总合同与入口同步

## 何时使用

出现以下任一变更时：

- JDK / Spring Boot / 前端主版本 / 服务端口 / 流量边界（HTTP vs WS / RAG 防腐层）
- 新增或修改架构 ADR，且影响全局约定
- 用户要求「更新 AGENTS」「同步项目合同」「改入口分层」

## 来源（巩固铸造依据）

同一套路在以下情景中反复出现：

1. `brain/20-episodic/sessions/2026-07-25-脚手架v2加固.md`（入口去重）
2. `brain/20-episodic/sessions/2026-07-25-补齐项目私有skills.md`（目录护栏 → Skills + paths）
3. `brain/20-episodic/sessions/2026-07-26-统一根AGENTS项目总合同.md` + [[ADR-0006-唯一根AGENTS项目总合同]]

## 步骤

1. **分类变更**（只改该改的一层）：
   - 稳定全局约束 → 更新根 `AGENTS.md`
   - 目录特定检查 → 更新或新建 `.agents/skills/<name>/SKILL.md`（可加 `paths`）
   - 决策理由 / 长知识 → ADR 或 `brain/10-semantic/`
2. **禁止**：在 `linkedagent-backend/*/` 或 `linkedagent-frontend/` 下新建 `AGENTS.md`。
3. **禁止**：把长细则复制进 `.cursor/rules/`；规则只保留指针。
4. 若新建 Skill：目录必须在 `.agents/skills/`（复数），`name` 与目录名一致，并更新 `brain/30-procedural/skills-index.md`。
5. 在 ADR 或 `brain/10-semantic/architecture/agent-entry-layering.md` 中补上交叉链接。

## 关键约束

- 全仓只允许一份根 `AGENTS.md`。
- Skill 放错到 `.agent/skills/`（单数）等于未加载。
- 拿不准归哪一层时，先写 `brain/_inbox/`，不要同时改三处。

## 相关

`AGENTS.md` · `brain/10-semantic/architecture/agent-entry-layering.md` · `brain/30-procedural/skills-index.md`
