---
type: core
created: 2026-07-25
status: evolving
tags: [核心记忆, 项目地图]
---

# 项目地图

> LinkedAgent 代码库的鸟瞰图。结构变化时应同步更新本文（属于少数允许原地更新的核心记忆）。

## 一句话定位

LinkedAgent = 智能客服平台：AI（RAG + 大模型）先答，答不了无缝转人工，全程 WebSocket 实时通信。

## 仓库结构

```
LinkAgent/
├── AGENTS.md                    # 唯一项目总合同：基线、约束、目录、角色
├── .cursor/rules/ · commands/   # Cursor 规则与 /收尾 /沉淀 等
├── brain/                       # 记忆库 Vault
├── linkedagent-backend/         # Java 17 / Spring Boot 3.2.4 多模块
│   ├── common-core/
│   ├── api-gateway/             # :8080
│   ├── chat-server/             # :8081
│   ├── customer-service/        # :8082
│   ├── ai-rag-service/          # :8083
│   └── system-management/       # :8084
├── linkedagent-frontend/        # React / TypeScript / Vite，dev :5173
├── .agents/skills/              # 目录特定护栏与项目私有 Skills
├── openspec/ · docs/ · design-system/
└── ONE_CLICK_START.md           # 智能 AI 一键后台自动部署启动手册（替代传统 bat/ps1 脚本）
```

## 代码锚点（给 AI 跳转）

| 关注点 | 路径 |
|---|---|
| WS JWT 握手 | `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptor.java` |
| 公共 JWT 工具 | `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java` |
| 认证 / SysUser | `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/`（`controller/AuthController.java` · `service/AuthService.java` · `config/SecurityConfig.java`） |
| 前端访客聊天 | `linkedagent-frontend/src/store/chatStore.ts` |
| 前端客服工作台 | `linkedagent-frontend/src/store/agentStore.ts` · `src/components/AgentWorkbench.tsx` |
| 会话编排 / 转人工 | `linkedagent-backend/customer-service/.../chat/ChatOrchestrationService.java` · `service/RoutingService.java` |
| 登录 / 落地页 | `linkedagent-frontend/src/components/LoginPage.tsx` · `src/pages/LandingPage.tsx` |
| 知识库文档上传 | `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/controller/AiController.java`（`POST /api/ai/doc/upload`；旧 `DocumentController` 已删除） |
| 演示闭环不变量 | `brain/10-semantic/architecture/demo-closed-loop-invariants.md` |
| 技术规格书 | `LinkedAgent_Technical_Spec.md` |
| 现行规格 | `openspec/specs/` |

## 核心数据流

1. **AI 问答**：前端 →(WS)→ `chat-server` → Redis 暂存 →（异步）`customer-service` 落库；同时 → `ai-rag-service` → pgvector → 大模型 → WS 流式回推。
2. **转人工**：双轨触发 → 过滤满载 → Round-Robin；否则 Redis 排队 / 离线留言。
3. **鉴权**：匿名 JWT → WS Query → `JwtWebSocketInterceptor`。

## 技术栈速查

| 层 | 选型 |
|---|---|
| 前端 | React + Vite + TailwindCSS + shadcn/ui + zustand |
| 后端 | Java + Spring Boot + Spring Cloud + Nacos + OpenFeign |
| 存储 | PostgreSQL（+pgvector）、Redis |
| AI | 外部大模型 API（防腐层），向量约 1536 维 |

## 相关

[[glossary]] · [[system-overview]] · [[memory-map]] · [[HOME]]
