---
name: adr-write
description: 将架构决策写成 ADR 存入 brain/10-semantic/decisions/。当出现多个备选方案并做出选择、需要记录「为何选 A 不选 B」、或要推翻既有架构决策时使用。
---

# adr-write — 架构决策记录

## 何时使用

- 做了会影响后续多处代码的技术选型（存储、协议、分层、第三方依赖）。
- 明确否决了某个备选方案，理由值得留存。
- 要改变一条既有的架构约束。

**不该写 ADR 的情况**：纯实现细节、可轻易回退的局部改动、还没定的想法（那些进 `_inbox/`）。

## 步骤

1. 先跟用户确认四件事：**背景**（面临什么问题）、**备选**（考虑过哪些方案）、**决策**（选了哪个）、**后果**（收益与代价）。缺一项就问，不要替用户脑补。
2. 查 `brain/10-semantic/decisions/` 现有编号，取下一个四位序号。
3. 写入 `brain/10-semantic/decisions/ADR-XXXX-决策简述.md`，套 `brain/_templates/ADR.md`。
4. 在「后果」里必须写明 ⚠️ 代价，以及**什么条件下需要重新评估这个决策**。
5. 在根 `AGENTS.md`（仅当项目级稳定约束改变）或 `brain/10-semantic/architecture/` 相关笔记里增加指向本 ADR 的链接。目录特定检查应更新对应 Skill，不新增子目录 `AGENTS.md`。

## 推翻既有决策时

不要删除、不要原地改写旧 ADR。正确做法：

1. 新写一篇 ADR，在「状态」写明 `accepted（取代 ADR-XXXX）`。
2. 把旧 ADR 的 frontmatter `status` 改为 `superseded`，并在文末加一行指向新篇。
3. 旧文正文保持不动——它记录的是当时的真实判断。

## 关键约束

- 未确认的猜测不能标 `accepted`，用 `proposed`。
- 不复制大段业务源码进 ADR，用路径引用。

## 相关

`brain/_templates/ADR.md` · `brain/00-core/constitution.md`（决策留痕铁律）
