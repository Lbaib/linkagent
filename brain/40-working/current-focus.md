---
type: working
updated: 2026-07-27
tags: [工作记忆, 焦点]
---

# 当前焦点

> 每次会话收尾时更新。这是新会话的第一个必读文件。

## 当前状态

- ✅ `feat/demo-closed-loop`：访客匿名 AI 流式 → 转人工 → 单客服接管；终审两项 Important 已修（JWT 外置、转人工幂等）。
- ✅ 二次巩固与本会话收尾完成；[[ADR-0008-JWT签名密钥外置fail-closed]] · [[demo-closed-loop-invariants]] 已入库。
- ⏳ 双浏览器 e2e 未跑，**不得宣称演示通过**。

## 下一步（按优先级）

1. **人工 e2e**：各后端设同一 `LINKEDAGENT_JWT_SECRET`（≥32）+ `OPENAI_API_KEY`，按 `ONE_CLICK_START.md` 启服务；双浏览器验证提问流式、转人工、客服接管、断线重排队、无密钥时报错不编造。
2. **e2e 通过后**：离线留言落库 / 满载排队位次 / token 级 LLM 流式，三选一立项。
3. 待决仍挂 [[open-questions]]（openspec 单数路径、设计 skills 稀释）——无新证据前不动。

## 阻塞点

- e2e 依赖本机 PostgreSQL / Redis / Nacos 与上述环境变量。
- Hooks 依赖 PATH 中的 `node`。

## 相关

[[scratchpad]] · [[open-questions]] · [[2026-07-27-演示闭环收口与二次巩固]] · [[2026-07-27-二次记忆巩固]] · [[HOME]]
