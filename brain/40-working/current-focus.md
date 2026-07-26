---
type: working
updated: 2026-07-26
tags: [工作记忆, 焦点]
---

# 当前焦点

> 每次会话收尾时更新。这是新会话的第一个必读文件。

## 当前状态

- ✅ 记忆脚手架 v1 → v2（入口去重 / inbox / 嵌套 AGENTS / 斜杠命令）→ [[2026-07-25-脚手架v2加固]] · [[ADR-0004-入口去重与inbox两段式]]
- ✅ v3：补齐 6 个项目私有 skills 与「沉淀 → 铸造 skill」管线 → [[2026-07-25-补齐项目私有skills]] · [[ADR-0005-项目私有skills与铸造管线]]
- ✅ v4：收敛为唯一根 `AGENTS.md` 项目总合同；删除六个模块入口，目录护栏统一由 Skills 承担 → [[ADR-0006-唯一根AGENTS项目总合同]]
- ✅ 脚手架已纳入 Git（连续性不再只是本地文件）；修正 `brain/.gitignore` 相对路径；文档与核心 Templates / Dataview 对齐（不再写 Templater）
- 业务代码仍有大量未提交改动（认证、LandingPage、登录页等），与脚手架分开看待。

## 下一步（按优先级）

1. 设计类 skills 与治理 skills 隔离/降权（评估项 3 残留）——待定。
2. `.agent/skills/` 下 openspec skills 暂不迁移。
3. 日常：开聊直接提需求；收工打 `/收尾`；金句打 `/沉淀`；择机真做一次 `/巩固记忆`。
4. 后续若升级 JDK、Spring Boot、前端主版本或端口分配，同步更新根 `AGENTS.md`。
5. 业务侧未提交改动：用户决定何时整理提交。

## 阻塞点

- 无。

## 相关

[[scratchpad]] · [[open-questions]] · [[daily-usage]] · [[HOME]]
