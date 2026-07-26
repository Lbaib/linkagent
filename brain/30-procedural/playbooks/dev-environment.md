---
type: playbook
created: 2026-07-25
status: stable
tags: [程序记忆, 手册, 环境]
---

# 手册：本地开发环境启动

## 端口分配（权威口径）

| 服务 | 端口 |
|---|---|
| api-gateway | 8080 |
| chat-server (WebSocket) | 8081 |
| customer-service | 8082 |
| ai-rag-service | 8083 |
| system-management | 8084 |
| 前端 (Vite dev) | 5173 |
| Nacos | 8848 |
| PostgreSQL / Redis | Docker Compose 默认（见 `linkedagent-backend/docker-compose*`） |

## 启动方式

- **完整冷启动**（含 Docker 中间件）：仓库根执行 `start-backend.ps1`
  1. 启动 Docker Desktop 服务 → 重启 winnat（解决 8848 端口被 Hyper-V 保留的问题）
  2. `docker compose up -d`（Postgres / Redis / Nacos）
  3. 轮询等待 Nacos 8848 就绪
  4. 逐个以 `mvn spring-boot:run -pl <服务名>` 在独立窗口拉起五个微服务（间隔 2s 削峰）
- **中间件已在跑，只启服务+前端**：`start-services-only.ps1`
- **全量（后端+前端）**：`start-all.ps1`

## 已知坑

- Windows 上 Nacos 8848 端口偶发被 Hyper-V 动态端口段占用，`Restart-Service winnat` 可解（脚本已内置）。
- 微服务必须等 Nacos 就绪后再启动，否则注册失败。

## 相关

[[project-map]] · [[system-overview]]
