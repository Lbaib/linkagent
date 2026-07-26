---
type: knowledge
created: 2026-07-25
status: evolving
tags: [语义记忆, 架构]
source: LinkedAgent_Technical_Spec.md
---

# 系统架构总览

> 从技术规格书提炼的架构核心事实。规格书是权威来源，本文是便于检索的摘要 + 双链索引。

## 分层拓扑

```
展示层     React 前端 (linkedagent-frontend)
             │ HTTP                    │ WebSocket (ws://, JWT in query)
网关层     api-gateway                chat-server ← 独立端口，物理隔离
             │                          │
业务层     customer-service ←OpenFeign→ ai-rag-service    system-management
             │                          │
存储层     PostgreSQL (+pgvector)     Redis (会话态/队列/PubSub)
```

服务治理：Nacos（注册发现 + 配置中心）；内部同步调用 OpenFeign；异步解耦初期用 Redis List/PubSub，预留 RocketMQ/Kafka 标准接口。

## 关键架构特征

1. **长短连接物理隔离**：WS 流量绕过主网关直连 `chat-server`，防止高并发长连接拖垮 HTTP 网关 → [[ADR-0001-长短连接物理隔离]]
2. **单库承载向量检索**：pgvector 让业务数据与知识向量同库，省掉独立向量数据库运维 → [[ADR-0002-pgvector承载向量检索]]
3. **大模型防腐层**：`ai-rag-service` 内统一适配器接口，换模型厂商只换实现类。
4. **冷热数据分层**：热（在线会话态/排队/路由表）→ Redis；冷（历史消息/知识库/账单）→ PostgreSQL。
5. **高吞吐写路径**：消息先写 Redis 保吞吐，`customer-service` 异步批量落库（`MessagePersistenceTask`）。

## 容错与风控

- 外部大模型调用处：熔断降级 + 限流（Sentinel 方向）。
- 断线重连：前端指数退避 + 消息 ACK 补发机制。
- 内容风控：消息到达 `chat-server` 后先过敏感词拦截器再落库/下发。

## 已知演进方向

- 流量激增时以 RocketMQ/Kafka 替代 Redis 承担异步削峰。
- 底层模型已预留租户隔离标识，可演进为多租户 SaaS。

## 相关

[[project-map]] · `openspec/specs/` · [[HOME]]
