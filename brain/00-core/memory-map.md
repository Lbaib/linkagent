---
type: core
created: 2026-07-25
status: stable
tags: [核心记忆, 记忆地图]
---

# 记忆地图（怎么记）

> 本文件是「怎么记」的单一真相。项目技术基线、顶层架构约束、目录导向与团队角色由根 `AGENTS.md` 统一声明；`.cursor/rules/` 仅做工具入口。

## 原则

1. **一篇一题**；可沉淀结论默认先写 `brain/_inbox/`，再归档。
2. **认知层**回答「怎么记」；语义/领域笔记回答「记什么」；用 `[[双链]]`，不双份长文。
3. **情景记忆只追加**（`20-episodic/`）；错字修正除外，不改写历史。
4. **禁止**写入密钥、令牌、生产连接串。
5. 简体中文；代码标识符与专有名词保留原文。

## 目录与读写策略

| 路径 | 层 | 用途 | 谁写 / 何时 |
|---|---|---|---|
| `00-core/` | 核心 | 身份、宪法、项目地图、术语、本文件 | 极少改；改动需用户同意 |
| `10-semantic/` | 语义 | 架构知识、ADR、领域事实 | 巩固时 / 明确决策时 |
| `20-episodic/` | 情景 | 会话日志、复盘 | 每次实质工作收尾 |
| `30-procedural/` | 程序 | 工作流、操作手册 | 流程稳定后 |
| `40-working/` | 工作 | current-focus / scratchpad / open-questions | 每会话读写 |
| `_inbox/` | 捕获 | 未归档笔记；`auto/` 为 Cursor sessionEnd 候选 | 会话中随时；结束后自动候选；事后归档 |

| `_dashboards/` | 观测 | Dataview 仪表盘 | 人读；AI 一般不改 |
| `_templates/` | 模板 | 会话日志 / ADR / 知识笔记 | 核心插件 Templates（非 Templater） |

仓库内还有一层「可执行的程序记忆」：`.agents/skills/`（项目私有 skills，索引见 [[skills-index]]）。文档回答「人怎么查」，skill 回答「AI 在什么时机自动照做」。

## 默认捕获 → 归档

1. 有可沉淀点 → 写 `_inbox/YYYY-MM-DD-短标题.md`（可用模板「知识笔记」；标明 `memory_kind`：Correction / Decision / Debug / Insight / Pattern）。
2. 判断落点：工作焦点 → `40-working/`；稳定事实 → `10-semantic/`；情节/决策 → `20-episodic/` 或 ADR；流程 → `30-procedural/`。
3. 移动文件，补双链；从收件箱仪表盘消失即完成。
4. 不确定落点时**宁可留在 inbox**，不要硬塞。
5. **Correction（用户纠正）优先捕获**，不要等收尾才想起来。

## 会话协议（摘要）

- **启动**：读 [[current-focus]]；动架构前查 `10-semantic/decisions/`；结构不清查 [[project-map]]。
- **进行中**：临时想法 → [[scratchpad]]；悬案 → [[open-questions]]；可沉淀结论 → `_inbox/`。
- **收尾**（实质工作后）：写会话日志 → 更新 current-focus → 有架构决策写 ADR → 清理已固化的 scratchpad。
- **巩固**（每 5~10 篇日志或里程碑）：见 [[memory-consolidation]]；反复出现的套路铸成 skill。

详细步骤：[[session-start]] · [[session-end]] · [[memory-consolidation]] · [[skills-index]]

## 命名

- Inbox / 会话日志：`YYYY-MM-DD-短标题.md`
- ADR：`ADR-XXXX-决策简述.md`（四位递增）
- Frontmatter 建议：`type` / `created` / `status` / `tags`

## 相关

[[constitution]] · [[identity]] · [[HOME]]
