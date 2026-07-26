---
name: session-wrap
description: 会话收尾——写情景日志、更新当前焦点、补 ADR、处理 inbox。当用户说「收尾」「今天到这」「结束」，或一段实质工作完成需要落盘时使用。
---

# session-wrap — 会话收尾

## 何时使用

改了代码 / 做了决策 / 产生了新认知 → 必须收尾。纯问答、纯查询可跳过。

## 步骤

1. **写会话日志**：`brain/20-episodic/sessions/YYYY-MM-DD-主题.md`，套 `brain/_templates/会话日志.md`。
   - 重点写**为什么这么做**，不要只罗列改了哪些文件——文件列表 git 里有，动机只有你记得。
   - 同一天多次会话：主题细分，不要覆盖已有文件。
2. **补 ADR**：本次若有架构选择，调用 `adr-write` skill。
3. **更新 `brain/40-working/current-focus.md`**：改写「当前状态 / 下一步 / 阻塞点」三段。下一步要具体到可执行。
4. **处理 inbox**：本次进 `brain/_inbox/` 的条目，能归档的归档；不确定的留着。
5. **清理 `brain/40-working/scratchpad.md`**：已固化的删掉，未解决的迁到 `open-questions.md`。
6. **同步地图**：模块或目录结构有变 → 更新 `brain/00-core/project-map.md`。

## 收尾后向用户汇报

用简短中文说明：日志写在哪、焦点的下一步是什么、还有什么悬着。不要复述全文。

## 关键约束

- **不改写 `brain/20-episodic/` 的历史文件**，只新增。
- 只有项目级稳定基线、顶层架构约束、目录导向或角色分工才更新根 `AGENTS.md`；记忆细则写入 `memory-map.md`，目录检查写入 Skill，`.cursor/rules/` 保持薄。

## 相关

`brain/30-procedural/workflows/session-end.md` · `brain/00-core/memory-map.md`
