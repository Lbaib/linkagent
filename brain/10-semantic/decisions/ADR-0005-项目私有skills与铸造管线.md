---
type: adr
id: ADR-0005
created: 2026-07-25
status: accepted
tags: [语义记忆, 决策, 记忆库, skills]
---

# ADR-0005：项目私有 skills 放 `.agents/skills/`，并建立「沉淀 → 铸造 skill」管线

## 状态

accepted（补充 [[ADR-0004-入口去重与inbox两段式]]，不取代）

## 背景

v2 脚手架把「怎么做」写成了 `brain/30-procedural/` 下的普通文档，靠规则里一句话指路。问题是文档不会在需要时自动到场——AI 得先想起来去读它，实际触发率很低。这与本仓 `.agent/skills/`（单数）下 5 个 openspec skill 的处境相同：它们不在任何工具的扫描路径上，从未被真正加载。

同时缺少一条把经验转化为能力的路径：会话日志里反复出现的套路，除了变成一篇没人读的手册之外无处可去。

## 决策

1. **项目私有 skills 统一放 `.agents/skills/`**。该目录同时被 Cursor 与 Codex 自动扫描，覆盖面最广（其余可选：`.cursor/skills/`、`.claude/skills/`、`.codex/skills/`；单数 `.agent/skills/` 与仓库根 `skills/` **不被扫描**）。
2. **首批 6 个 skill**：记忆类 `memory-capture` / `adr-write` / `session-wrap` / `skill-forge`，项目私有代码类 `ws-contract-check` / `rag-guardrails`（后两个用 `paths` 限定生效范围）。
3. **四种机制分工**：规则（每次会话）／skill（特定时机自动到场）／命令（用户主动触发，做成指向 skill 的薄壳）／文档（人类查阅）。
4. **建立铸造管线**：记忆巩固第 2 步新增分流去向「反复出现 ≥3 次的套路 → 铸造成 skill」，由 `skill-forge` 承载判断标准与写法。

## 理由

- skill 的 `description` 让模型能按情境自动选中，这是文档做不到的。
- `paths` 限定使代码类 skill 只在相关目录出现，不污染其他任务的上下文。
- 命令做成薄壳指向 skill，延续 v2「一套真相、多扇门」的防漂移原则。
- 铸造管线让记忆系统具备自我扩展能力：用得越久，AI 的自动化行为越贴合本项目。

## 后果

- ✅ 架构约束能在改对应代码时自动到场，不依赖 AI 自觉。
- ✅ 经验有了固化出口，巩固不再只是搬运文字。
- ⚠️ 新增 skill 需重开会话才加载。
- ⚠️ skill 数量膨胀会稀释模型选择准确率，需在巩固时主动修剪。
- ⚠️ `.agent/skills/` 下的 openspec skills 仍未生效，是否迁移到 `.agents/skills/` 待定（见 [[open-questions]]）——此事涉及既有工具链约定，未擅自改动。

## 相关

[[skills-index]] · [[memory-consolidation]] · [[ADR-0004-入口去重与inbox两段式]]
