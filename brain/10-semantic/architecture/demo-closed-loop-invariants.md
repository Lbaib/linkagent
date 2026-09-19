---
type: knowledge
created: 2026-07-26
status: evolving
tags: [语义记忆, 架构, WebSocket, 演示闭环]
---

# 演示闭环不变量（WS / 路由 / 凭证）

> 来自 `feat/demo-closed-loop` 实现与终审。改帧契约或转人工时必读。

## 拓扑

- HTTP → `api-gateway:8080`；WS → `chat-server:8081`（不经网关）。
- 前端开发：`ws://${window.location.host}/ws/...` + Vite 把 `/ws` 代理到 `ws://127.0.0.1:8081`——**不是**挂到 8080。
- 上下行：`chat:upstream` / `chat:downstream`（Redis Pub/Sub）；编排在 `customer-service`。

## JWT 与角色

- Claim `role`：`visitor` | `agent`（见 `JwtRoles`）。
- 签名密钥：[[ADR-0008-JWT签名密钥外置fail-closed]]；禁止源码硬编码。
- 存储隔离：**访客** `sessionStorage.visitorToken`；**客服/管理** `localStorage.accessToken`。禁止混用。
- 控制帧按角色门禁：`AGENT_READY` 仅 agent；`TRANSFER_AGENT` 仅 visitor。上行信封缺/非法 `role` 则丢弃。

## 转人工与单客服接管

- `TRANSFER_AGENT` → `RoutingService.assignAgent`；成功则访客 `agent_chat`，客服收 `SESSION_OFFER`。
- **幂等**：若访客已有绑定，不得再次 `assignAgent`；向原客服重发 offer/状态即可。
- 客服发 `CHAT` 必须带 `visitorId`，且须与当前绑定一致。
- 客服断线：解绑其访客，访客回 `queuing` 并收到系统提示。

## AI

- 回答经 `AI_STREAM`（累计文本 + `isDone`）；模型不可用 → `ERROR` / `AI_UNAVAILABLE`，**禁止伪造回答**。
- 模型密钥仅配置/环境变量（`OPENAI_API_KEY` 等）。

## 代码锚点

| 关注点 | 路径 |
|---|---|
| 编排 | `customer-service/.../chat/ChatOrchestrationService.java` |
| 路由 | `customer-service/.../service/RoutingService.java` |
| 握手 | `chat-server/.../JwtWebSocketInterceptor.java` |
| 访客 store | `linkedagent-frontend/src/store/chatStore.ts` |
| 客服 store | `linkedagent-frontend/src/store/agentStore.ts` |
| 帧常量 | `common-core/.../constant/WsFrames.java` |

## 相关

[[客服业务域]] · [[ADR-0001-长短连接物理隔离]] · [[ADR-0008-JWT签名密钥外置fail-closed]] · `openspec/changes/2026-07-26-ws-frame-contract/proposal.md`
