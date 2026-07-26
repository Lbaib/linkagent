---
type: knowledge
created: 2026-07-26
status: stable
tags: [语义记忆, 架构, AI脚手架]
source: ADR-0003~0006；会话 2026-07-25~26 脚手架系列
---

# Agent 入口与职责分层

> 独立可读摘要。细则与决策原文见相关 ADR。

## 核心事实

LinkedAgent 对 AI 工具采用三层分工，禁止混写：

| 层 | 位置 | 只放什么 |
|---|---|---|
| 项目总合同 | 根 `AGENTS.md`（全仓唯一） | 技术基线、顶层架构约束、目录导向、团队角色、验证命令 |
| 工具入口 | `.cursor/rules/`（薄） | 指向真相文件；不复制长细则 |
| 目录护栏 | `.agents/skills/` + `paths` | 改特定目录时才加载的检查清单 |
| 长知识 / 决策 | `brain/` | 记忆地图、ADR、会话日志、手册 |

## 已否决的做法

- 在各微服务 / 前端目录再放 `AGENTS.md`（曾短暂采用，被 [[ADR-0006-唯一根AGENTS项目总合同]] 修正）。
- 把记忆协议同时写进 `AGENTS.md` 与 cursor rule（双份漂移，见 [[ADR-0004-入口去重与inbox两段式]]）。
- 把 skill 放在 `.agent/skills/`（单数）或仓库根 `skills/`——**不会被 Cursor/Codex 扫描**。

## Skills 发现路径（权威）

仅：`.agents/skills/`、`.cursor/skills/`、`.claude/skills/`、`.codex/skills/`。本仓治理 Skills 统一在 `.agents/skills/`。

## 相关

`AGENTS.md` · [[skills-index]] · [[ADR-0005-项目私有skills与铸造管线]] · [[ADR-0006-唯一根AGENTS项目总合同]]
