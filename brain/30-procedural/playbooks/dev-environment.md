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

## 启动方式（AI 一键后台并发部署）

为防止杀毒软件拦截并治愈多桌面弹窗报错，旧有的 `.bat` 及 `.ps1` 启动脚本均已整体移除，**全栈启动以根目录下的 [ONE_CLICK_START.md](../../../ONE_CLICK_START.md) 为唯一技术核心执行手册**：
1. **统一启动指南**：无论是开发者本人还是对 Cursor / Codex / Antigravity 指挥“一键启动”，请要求 AI 重读并完整执行 `ONE_CLICK_START.md` 中说明的后台多线并行命令。
2. **高速预构建（杜绝并发争端）**：启动前必先单笔直达 `linkedagent-backend` 根区顺行一条大通执行：`docker compose up -d; Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force; mvn clean install -DskipTests -T 1C`。
3. **并发出舱运行**：通过系统异步主管道以无头态（Headless Background Tasks）一次性开播 5 套后台独立的 Maven Boot 部署，以及 1 套 Vite Node 开发长驻指令。

## 已知坑与解决对策

- **关于 8083 / 微服务端口占位痛点**：微信 (`Weixin.exe`) 等部分代理式通讯及加速应用，高频出现向本地随机申用占住 TCP `:8083` 并在握手结束后深埋在 `CLOSE_WAIT` 中。为**保护且不去暴力强制关闭**日常办公私人会话软件，所有后置启动命令（特别 `ai-rag-service`、网关等）全场覆盖注入 `--server.address=127.0.0.1` 神箭穿透，保证畅行启稳与 Nacos 的正路呼应注册！
- 微服务依赖 Nacos 注册发现：中间件体系启动（`docker compose`）须作为首席打起任务先行确认立住。

## 相关

[[project-map]] · [[system-overview]]
