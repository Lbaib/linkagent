---
type: working
updated: 2026-07-26
tags: [工作记忆, 焦点]
---

# 当前焦点

> 每次会话收尾时更新。这是新会话的第一个必读文件。

## 当前状态

- ✅ 记忆脚手架 v1→v4 已建并入库。
- ✅ 首次巩固完成；`agent-entry-sync` 已铸造。
- ✅ Cursor Hooks：`sessionStart` / `sessionEnd`（含关键片段栏）→ [[ADR-0007-Cursor-Hooks自动注入与候选留底]]
- ✅ 沉淀标准升级：`memory-capture` 区分 Correction / Decision / Debug / Insight / Pattern；规则增加克制版认知检查点
- 业务代码仍有大量未提交改动，与脚手架分开看待。
- ✅ 演示闭环：访客匿名 AI 流式 → 转人工 → 单客服真实接管；WS 帧契约前后端对齐；模型密钥迁出源码。
- ⏳ 双浏览器端到端演示（Task 11 Steps 2–3）仍待人工验证，尚未宣称 e2e 通过。

## 下一步（按优先级）

1. **演示闭环的下一层**：离线留言落库、满载排队与队列位次、token 级 LLM 流式，三选一立项。
2. 待决：设计 skills 稀释、根 `.gitignore`/`target/`、openspec 迁移、DocumentController——见 [[open-questions]]。
3. 日常：开聊即可；结束可依赖 auto 留底；实质工作仍建议 `/收尾`。

## 阻塞点

- Hooks 依赖本机 PATH 中的 `node`；若未触发，检查 Hooks 输出通道。

## 相关

[[scratchpad]] · [[open-questions]] · [[daily-usage]] · [[HOME]]
