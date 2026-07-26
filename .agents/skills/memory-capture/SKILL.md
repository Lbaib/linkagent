---
name: memory-capture
description: 把对话中的可复用结论沉淀到 brain/_inbox/。当用户说「记一下」「沉淀」「写进知识库」，或出现用户纠正、非显而易见的调试结论、可复用决策、跨会话洞察时使用。
---

# memory-capture — 知识沉淀

## 何时使用

- 用户明确说「记一下」「沉淀」「存起来」。
- 对话中出现下表任一高价值类型（尤其是 **Correction**）。
- 总判据：**三个月后的自己或另一个 AI 会需要这条吗？** 是 → 沉淀；纯中间步骤 → 不沉淀。

## 高价值记忆类型（优先捕获）

| 类型 | 含义 | 例子 | 优先级 |
|---|---|---|---|
| **Correction** | 用户纠正了 AI 的做法或否决了某方案 | 「别用这个库」「不要嵌套 AGENTS」 | **最高** |
| **Decision** | 可复用的取舍，含「为何不选 B」 | 选 pgvector 而非独立向量库 | 高 |
| **Debug** | 非显而易见的排障结论 | 生产缺某环境变量会静默 500 | 高 |
| **Insight** | 跨文件/跨模块的稳定约定 | 「日期处理必须走某工具类」 | 中高 |
| **Pattern** | 试错后发现的隐式规律 | 「Nacos 未就绪就启动必注册失败」 | 中 |

不要记：一次性命令输出、可从 git diff 直接看出的改动清单、情绪性抱怨、密钥。

## 步骤

1. 判定类型（上表）；一篇一题。标题要能独立看懂。
2. 写入 `brain/_inbox/YYYY-MM-DD-短标题.md`：

```markdown
---
type: inbox
created: YYYY-MM-DD
status: pending
memory_kind: Correction | Decision | Debug | Insight | Pattern
tags: [收件箱]
---

# 一句话结论

## 结论

## 为何重要

## 如何复用

## 证据摘录（可选）

> 保留关键原话 3～10 行即可；不要整段粘贴对话。用仓库相对路径指代码。
```

3. 可套用 `brain/_templates/知识笔记.md`。
4. 告诉用户已写入哪个文件；提醒按 `brain/00-core/memory-map.md` 归档。
5. 若是架构级 Decision → 同时考虑调用 `adr-write`。

## 关键约束

- **不确定落点就留在 `_inbox/`**。捕获和分类分开。
- Correction / Decision 宁可多记一条，也不要漏。
- 禁止密钥、令牌、生产连接串。
- 不复制大段源码，用路径引用。

## 相关

`brain/00-core/memory-map.md` · `brain/_dashboards/收件箱.md` · `.cursor/commands/沉淀.md`
