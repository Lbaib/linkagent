---
name: ws-contract-check
description: 校验 LinkedAgent 的 WebSocket 长连接与 JWT 握手契约在前后端之间保持一致。改动 WS 连接建立、握手鉴权、消息帧格式、心跳或相关端口配置时使用。
paths:
  - linkedagent-backend/chat-server/**
  - linkedagent-backend/common-core/**
  - linkedagent-frontend/src/store/**
---

# ws-contract-check — WebSocket 契约一致性检查

## 何时使用

改动以下任一处时，另外两处都要同步核对：

- `linkedagent-backend/chat-server/`（服务端握手与消息帧）
- `linkedagent-backend/common-core/`（`JwtUtils` 签发与校验）
- `linkedagent-frontend/src/store/`（客户端连接与重连）

## 不可违反的架构约束

1. **WebSocket 不走 `api-gateway`**。前端 `ws://` 直连 `chat-server`（默认 8081）。这是长短连接物理隔离的核心，见 `brain/10-semantic/decisions/ADR-0001-长短连接物理隔离.md`。
2. **JWT 放在 WS URL 的 Query 参数里**，不是 Header——浏览器原生 WebSocket 不支持自定义 Header。
3. 服务端握手校验入口：`linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptor.java`
4. 签发与校验必须共用 `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java`，两端不得各写一套。

## 检查清单

改动后逐条确认：

- [ ] 签发方（`customer-service` 的 `AuthService`）与校验方（`chat-server` 拦截器）使用同一套密钥与声明字段。
- [ ] Query 参数名前后端一致（改名必须同时改前端连接代码）。
- [ ] 前端指数退避重连逻辑仍能在 token 过期时正确处理 401/握手失败，而不是无限重连。
- [ ] 消息 ACK 与补发机制未被破坏。
- [ ] 端口未被改到 `api-gateway` 后面。
- [ ] JWT 不会被完整打进日志（URL 里带 token，注意脱敏）。

## 关键约束

- 不要为了"方便"把 WS 挂到网关后面，即使本地调试跑得通。
- 契约变更属于行为变更 → 走 `openspec/` 流程，并考虑写 ADR。

## 相关

`AGENTS.md` · `brain/10-semantic/architecture/system-overview.md`
