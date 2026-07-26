# AGENTS.md — LinkedAgent 项目总合同

> 本仓库唯一的 `AGENTS.md`。适用于 Cursor、Codex、Antigravity 等编码代理。
> 本文件只保留项目级稳定约束、目录导向与角色分工；长知识进入 `brain/`，情境化检查进入 `.agents/skills/`。

## 1. 项目与技术基线

**LinkedAgent**：AI RAG 优先回答、低置信度转人工的智能客服平台。

| 范围 | 基线 |
|---|---|
| 后端 | Java 17、Spring Boot 3.2.4、Spring Cloud 2023.0.1、Spring Cloud Alibaba 2023.0.1.0、Maven 多模块 |
| 前端 | React 19.2、TypeScript 6.0、Vite 8、Tailwind CSS 4、npm（`package-lock.json`） |
| 数据 | PostgreSQL + pgvector、Redis |
| 治理 | Nacos 注册发现与配置、OpenFeign 内部同步调用 |

版本真相以 `linkedagent-backend/pom.xml` 与 `linkedagent-frontend/package.json` 为准；本文件随基线升级同步更新。Node.js 版本当前未锁定，不得自行假定。

## 2. 顶层架构约束

1. HTTP 短连接统一进入 `api-gateway:8080`；WebSocket 长连接绕过网关，直连 `chat-server:8081`。
2. 业务服务不得直连外部大模型；模型调用、Prompt 组装与向量检索统一经过 `ai-rag-service:8083` 的防腐层。
3. 在线会话态、排队和路由等热数据进入 Redis；历史消息、知识库和业务持久数据进入 PostgreSQL。
4. `customer-service:8082` 负责会话、路由、消息持久化与认证；`system-management:8084` 负责管理面能力。
5. 功能或外部行为变更走 `openspec/`；架构选择写 ADR，不以代码实现默默覆盖既有决策。
6. 禁止写入密钥、令牌和生产凭证；禁止手工修改或提交 `target/`、`node_modules/` 等构建产物。

架构详情：`brain/10-semantic/architecture/system-overview.md`

现有决策：`brain/10-semantic/decisions/`

## 3. 目录导向

| 路径 | 职责 |
|---|---|
| `linkedagent-backend/common-core/` | JWT 等跨服务公共能力 |
| `linkedagent-backend/api-gateway/` | HTTP 路由、跨域与网关能力 |
| `linkedagent-backend/chat-server/` | WebSocket 握手、连接和实时消息 |
| `linkedagent-backend/customer-service/` | 会话、认证、人工路由和消息落库 |
| `linkedagent-backend/ai-rag-service/` | RAG、Prompt、大模型防腐层 |
| `linkedagent-backend/system-management/` | 知识库、客服账号和监控管理 |
| `linkedagent-frontend/` | React 客户端与管理端 |
| `openspec/` | 现行规格与变更提案 |
| `brain/` | 项目记忆、ADR、会话历史和操作手册 |
| `.agents/skills/` | 项目私有、按情境加载的执行护栏 |

更细代码地图：`brain/00-core/project-map.md`

## 4. 团队角色分工

默认角色是 **LinkAgent 架构师伙伴**。同一个代理可按任务切换工作帽；用户明确指定角色时优先服从。

| 角色 | 负责 | 主要入口 |
|---|---|---|
| 架构 / 规格负责人 | 边界、取舍、OpenSpec、ADR | `openspec/`、`brain/10-semantic/decisions/` |
| 后端工程师 | Java 微服务、数据与服务间契约 | `linkedagent-backend/` |
| 前端工程师 | React 页面、状态与交互 | `linkedagent-frontend/`、`design-system/` |
| AI / RAG 工程师 | 检索、切片、Prompt、模型适配 | `ai-rag-service/`、`system-management/` |
| 测试 / 审查负责人 | 测试、契约检查、回归与风险审查 | 各模块测试、`openspec/specs/` |
| 知识管理员 | 会话收尾、沉淀、巩固与 Skill 铸造 | `brain/`、`.agents/skills/` |

跨域任务由架构 / 规格负责人先确认边界，再进入具体工程角色；不要让多个角色各自发明不同契约。

## 5. AI 工作协议

动手前依次读取：

1. `brain/00-core/identity.md`
2. `brain/00-core/memory-map.md`
3. `brain/40-working/current-focus.md`
4. 涉及架构时再读 `brain/00-core/constitution.md` 与相关 ADR

项目私有 Skills 位于 `.agents/skills/`，索引见 `brain/30-procedural/skills-index.md`。目录特定约束由带 `paths` 的 Skill 自动加载，不再通过子目录 `AGENTS.md` 分散维护。

Cursor 命令：`/回顾进度`、`/沉淀`、`/收尾`、`/巩固记忆`。

Cursor Hooks（仅 IDE Composer）：`sessionStart` 自动注入 `current-focus`；`sessionEnd` 写入 `brain/_inbox/auto/` 候选记录。

Obsidian：将 `brain/` 作为 Vault，从 `brain/HOME.md` 开始。

## 6. 常用验证

- 后端：在 `linkedagent-backend/` 运行 `mvn test`
- 前端：在 `linkedagent-frontend/` 运行 `npm test`、`npm run lint`、`npm run build`

测试失败必须如实报告；未经验证不得声称完成。
