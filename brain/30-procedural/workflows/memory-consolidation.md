---
type: workflow
created: 2026-07-25
status: stable
tags: [程序记忆, 工作流]
updated: 2026-07-25
---

# 工作流：记忆巩固（Memory Consolidation）

> 可用 `/巩固记忆`。触发：约 5~10 篇会话日志，或里程碑结束。

## 步骤

1. **回放**自上次巩固以来的 `20-episodic/sessions/`。
2. **分流**，按四个去向：

| 发现 | 去向 |
|---|---|
| 反复出现的事实、约定 | `10-semantic/`（架构 / 领域知识） |
| 已成型但没记录的决策 | ADR（`adr-write` skill） |
| 反复执行的操作套路（≥3 次） | **新 skill**（`skill-forge` skill）或 `30-procedural/playbooks/` |
| 一次性的过程细节 | 不提炼，留在日志里 |

3. **清理**：归档 `_inbox/` 积压；移除已解决的 [[open-questions]]；压缩 [[scratchpad]]。
4. **修剪**：矛盾知识以最新为准；重大改向写「取代」ADR，不删旧文。
5. **留痕**：在 `20-episodic/retrospectives/` 写巩固记录；更新 [[HOME]] 与 [[skills-index]]。

## 关于第 2 步的「铸造 skill」

这是程序记忆的固化路径：**情景记忆里重复出现的套路 → 可被自动调用的 skill**。判断标准和写法见 `skill-forge`，核心是区分「需要在特定时机自动到场」（做成 skill）与「人类偶尔查阅」（留作文档）。

skill 不是越多越好——数量膨胀会稀释模型的选择准确率。拿不准就先留成 playbook，下次巩固再看它是否真的被反复需要。

## 质量

语义笔记须**独立可读**；巩固包含遗忘，总量应收敛而非单调膨胀。

## 相关

[[memory-map]] · [[skills-index]] · [[ADR-0005-项目私有skills与铸造管线]]
