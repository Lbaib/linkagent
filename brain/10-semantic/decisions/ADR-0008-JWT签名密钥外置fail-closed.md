---
type: adr
id: ADR-0008
created: 2026-07-26
status: accepted
tags: [语义记忆, 决策, JWT, 安全]
---

# ADR-0008：JWT 签名密钥外置与 fail-closed

## 状态

accepted

## 背景

`common-core` 的 `JwtUtils` 曾把 HMAC 签名密钥写死在源码常量中。演示闭环引入 JWT `role` claim（`visitor` / `agent`）后，同一密钥同时签发访客与客服令牌；知道源码常量即可伪造 `role=agent` 的 WS 握手，接管会话。备选：

1. 继续硬编码默认密钥（仅文档警告）
2. 环境变量 / 系统属性提供密钥，缺失则拒绝签发与校验（fail-closed）
3. 每服务独立密钥（破坏跨服务校验）

## 决策

选方案 2：`JwtUtils` 懒加载签名密钥，顺序为环境变量 `LINKEDAGENT_JWT_SECRET` → 系统属性 `linkedagent.jwt.secret`；缺失或不足 32 UTF-8 字节则抛 `IllegalStateException`。各后端进程必须使用**同一**密钥。单元测试通过系统属性注入测试密钥，并用 `clearCachedSecret()` 隔离。

## 理由

- 与「禁止硬编码密钥」及 ai-rag `OPENAI_API_KEY` 外置一致。
- fail-closed 避免静默使用弱默认导致「看起来能跑、实则可伪造」。
- 不选方案 3：`chat-server` 校验与 `customer-service` 签发必须共享密钥。

## 后果

- ✅ 关闭「读源码即可冒充客服」的路径；本地/CI 通过显式配置对齐。
- ⚠️ 未设环境变量时服务无法签发/校验 JWT，启动与联调成本上升；见 `ONE_CLICK_START.md`。
- ⚠️ 密钥轮换需同步所有服务进程。
- **重新评估条件**：改为非对称 JWT、或引入密钥管理服务（KMS/Vault）时，写取代本 ADR 的新篇。

## 相关

[[ADR-0001-长短连接物理隔离]] · `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java` · `ONE_CLICK_START.md` · [[ws-contract-check]]（skills-index）
