---
type: core
created: 2026-07-25
status: stable
tags: [核心记忆, 宪法]
---

# 行为宪法

> 不可违反的原则。修改本文件需用户明确批准，并在会话日志中留痕。

## 一、记忆铁律

1. **先读后写**：会话开始先读 [[current-focus]] 与 [[memory-map]]；动架构前先查 `10-semantic/decisions/` 的 ADR。
2. **情景记忆只追加**：`20-episodic/` 下的历史文件不得改写、不得删除（错字修正除外）。
3. **决策留痕**：影响架构的选择必须写 ADR；推翻旧决策时新写一篇并标注「取代 ADR-XXXX」，将旧 ADR 的 `status` 改为 `superseded`，不删除原文。
4. **会话必收尾**：产生实质工作的会话，结束前必须写会话日志并更新 [[current-focus]]。
5. **捕获先进 inbox**：可沉淀结论默认写入 `_inbox/`，再按 [[memory-map]] 归档；不确定落点时留在 inbox。
6. **职责不重叠**：根 `AGENTS.md` 只承载项目级稳定合同；记忆细则在 [[memory-map]]；目录检查在 Skills；`.cursor/rules/` 只做工具入口。禁止跨层复制长规则。

## 二、工程铁律

1. **规格先行**：新功能、行为变更走 `openspec/` 流程（`.agent/workflows/` 下的 opsx-propose → apply → archive）。
2. **架构一致性**：遵守根 `AGENTS.md` 的项目总合同与既有分层——HTTP 走 `api-gateway`，WebSocket 走 `chat-server` 独立端口，AI 调用一律经过 `ai-rag-service` 的防腐层，不允许业务服务直连大模型 API。目录特定护栏由 `.agents/skills/` 承载。
3. **数据分层**：热数据（会话态/队列/路由表）在 Redis，持久数据（历史消息/知识库/账单）在 PostgreSQL；不混用。
4. **不提交产物**：`target/`、`node_modules/`、构建产物不进入语义/情景记忆的讨论范围，也不应手工修改。

## 三、协作铁律

1. **破坏性操作先问**：删库、清数据、`git push --force`、改动生产配置，必须用户明确同意。
2. **诚实汇报**：测试失败就说失败；跳过的步骤明说；没做的事不声称做了。
3. **中文优先**：文档与交流用简体中文；代码注释、标识符遵循代码库现状。

## 修订历史

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-07-25 | v1.0 | 初版，随记忆库脚手架建立 |
| 2026-07-25 | v1.1 | 增补 inbox、入口去重、嵌套 AGENTS（ADR-0004） |
| 2026-07-26 | v1.2 | 收敛为唯一根 AGENTS；目录护栏回归 Skills（ADR-0006） |
