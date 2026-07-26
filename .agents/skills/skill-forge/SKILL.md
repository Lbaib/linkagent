---
name: skill-forge
description: 把反复出现的操作套路提炼成新的项目私有 skill，写入 .agents/skills/。在记忆巩固时，或发现同一套流程已被手工重复三次以上时使用。
---

# skill-forge — 把经验铸成技能

> 这是记忆系统的「程序记忆固化」环节：情景记忆里反复出现的套路 → 可被自动调用的 skill。

## 何时使用

满足**任一**条件即可考虑：

- 同一套操作流程在会话日志里出现过 **3 次以上**。
- 某个操作每次都要人提醒 AI「别忘了先查 X」。
- `brain/30-procedural/playbooks/` 里某篇手册已经稳定，且属于「该在特定时机自动到场」的知识。
- 执行 `/巩固记忆` 时（本 skill 是巩固流程的第 2 步分流去向之一）。

## 判断：该做成 skill 还是留作文档？

| 特征 | 归宿 |
|---|---|
| 需要在特定时机**自动**被想起 | **skill**（`.agents/skills/`） |
| 人类要读、AI 偶尔查 | 文档（`brain/30-procedural/playbooks/`） |
| 每次会话都必须遵守 | 规则（`.cursor/rules/`，但要极简） |
| 用户主动触发的固定动作 | 命令（`.cursor/commands/`，做成薄壳指向 skill） |

判断不了就先留成文档。skill 太多会稀释模型的选择准确率。

## 步骤

1. **确认来源**：指出这套路在哪几篇会话日志或哪个 playbook 里出现过，避免凭空造 skill。
2. **定名**：小写字母 + 数字 + 连字符，**必须与父目录名一致**。用动词短语，如 `ws-contract-check`。
3. **写 description**：这是 skill 能否被正确触发的**唯一决定因素**。必须包含「做什么」+「什么时候用」，把用户可能说的原话（中文触发词）也写进去。
4. **建文件**：`.agents/skills/<name>/SKILL.md`

```markdown
---
name: <与目录同名>
description: <做什么；什么情况下使用；包含中文触发词>
paths:                      # 可选，限定生效范围
  - linkedagent-backend/xxx/**
---

# <name> — 一句话说明

## 何时使用
## 步骤
## 关键约束
## 相关
```

5. **可选 `paths`**：只在改特定目录文件时才该出现的 skill，加上路径 glob 缩小噪音。
6. **可选 `disable-model-invocation: true`**：只允许 `/name` 手动调用，模型不会自动选。用于有副作用、不该被自动触发的操作。
7. **登记**：更新 `brain/30-procedural/skills-index.md`。
8. **告知用户**：新 skill 需要重开会话才会被加载。

## 关键约束

- 目录**必须**放在 `.agents/skills/`（Cursor 与 Codex 都自动扫描）。放在 `.agent/skills/`（单数）或仓库根 `skills/` **不会被发现**——本仓已有此前车之鉴。
- `name` 与父目录名不一致会导致加载失败。
- 一个 skill 只解决一件事；步骤控制在能一眼读完的长度。
- 不要把 `brain/` 里的长文复制进 SKILL.md，用路径指过去。

## 相关

`brain/30-procedural/workflows/memory-consolidation.md` · `brain/30-procedural/skills-index.md`
