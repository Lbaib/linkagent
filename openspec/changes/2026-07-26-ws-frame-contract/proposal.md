# WebSocket 帧契约对齐与人工接管闭环

## Why

前端 `chatStore` 与后端 `chat-server` 的消息帧语义不一致（前端 `CHAT`/`TRANSFER_AGENT`，后端 `direct`），导致访客侧无法真正走通 AI 问答与转人工。

## What Changes

- `client-auth`：匿名与登录 JWT 增加 `role` claim（`visitor` / `agent`）；WS 握手写入 `connectionId` 与 `role`。
- `ai-chat`：AI 回答通过 `AI_STREAM` 帧分片回推；模型不可用时下发 `ERROR` 帧，不返回伪造回答。
- `agent-routing`：`TRANSFER_AGENT` 触发分配；有在线客服即接管，否则保持 `queuing` 并提示；客服断线时访客回退 `queuing`。
- `agent-chat`：客服 `CHAT` 帧携带 `visitorId`，与访客双向转发。

## Impact

- Affected specs: `client-auth`、`ai-chat`、`agent-routing`、`agent-chat`
- Affected code: `common-core`、`chat-server`、`customer-service`、`ai-rag-service`、`linkedagent-frontend`
- 未纳入本次：满载排队压力、离线留言落库、token 级 LLM 流式
