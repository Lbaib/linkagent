# 演示闭环：访客 AI → 转人工 → 单客服接管

**日期：** 2026-07-26  
**状态：** 设计已确认，待实现计划  
**范围标签：** 业务闭环（主）+ 工程债（辅）

## 1. 背景与目标

LinkedAgent 后端 MVP 骨架与前端 `chatStore` 帧约定已分别存在，但 **前后端 WebSocket 契约未对齐**：前端发送 `CHAT` / `TRANSFER_AGENT` 并期望 `AI_STREAM` / `STATUS_UPDATE`，而 `chat-server` 仍是早期 `direct` + Redis List 缓冲模型。客服工作台仍依赖 `SimulationContext`。记忆脚手架已完成，下一步应以可演示的业务闭环为主。

### 成功标准

1. **双浏览器真实链路**：访客匿名提问 → 真实 RAG/大模型回复（流式呈现）→ 转人工 → 单客服真实接管并双向聊天。
2. **密钥缺失或模型失败时**：推送明确错误，**不伪造 AI 答案**。
3. **简化版转人工**：仅要求「至少一名客服在线」即可分配；不做满载排队压力演示，不做离线留言落库。
4. **工程债（辅）**：根目录 `.gitignore` + 从 Git 索引移除已跟踪的 `target/`；确认知识库上传仍在 `ai-rag-service` 的 `AiController`，并更新 `brain/00-core/project-map.md`。

### 明确不做

- 满载排队 / 队列位次压力测试
- 离线留言表单落库
- `.agent/skills/` openspec skills 路径迁移（用户决定不再纳入）
- 设计 skills 稀释治理
- 未提交落地页 / 登录视觉改动的合入（认证能力收编，视觉合入另议）
- 真实 LLM token 级 SSE（本轮用同步 `/ask` + 分片推 `AI_STREAM`）

## 2. 方案选择

采用 **方案 1：契约对齐 + 职责分层**。

| 方案 | 摘要 | 结论 |
|---|---|---|
| 1. 分层对齐 | `chat-server` 只做连接与帧转发；业务在 `customer-service`；模型在 `ai-rag-service` | **采用** |
| 2. 胖 chat-server | 连接层直调模型与路由 | 拒绝：破坏 ADR-0001 / AGENTS 边界 |
| 3. 分两轮 | 先访客↔AI，再转人工 | 拒绝：与「整条要真」成功标准不完全一致 |

## 3. 架构与边界

| 组件 | 职责 |
|---|---|
| 前端访客 | `GET /api/auth/anonymous` → JWT → `ws://…/ws/chat?token=`；发 `CHAT` / `TRANSFER_AGENT` |
| 前端客服 | `POST /api/auth/login`（`SysUser`）→ 同 WS；发 `AGENT_READY` / `CHAT`；`AgentWorkbench` 脱离模拟上下文 |
| `api-gateway:8080` | HTTP（鉴权、管理、AI HTTP）；**不承载 WS** |
| `chat-server:8081` | JWT 握手、连接表、帧解析、Redis Pub/Sub 上下行；**不调大模型** |
| `customer-service:8082` | 签发 JWT；会话态；转人工分配；Feign 调 AI；编排 `AI_STREAM` 分片推送 |
| `ai-rag-service:8083` | 检索 + 大模型防腐；`POST /api/ai/ask` 同步返完整答案；密钥仅来自配置/环境变量 |
| Redis | 会话态、在线客服集合、Pub/Sub 事件通道 |
| PostgreSQL | 消息异步落库（沿用现有缓冲任务，本轮不扩大范围） |

**流式策略：** `customer-service` 调用同步 `/api/ai/ask`，获得全文后按块经 Redis 推送 `AI_STREAM`（最后一帧 `isDone=true`）。

## 4. 身份与 WS 帧契约

### 4.1 身份

| 角色 | 取 token | JWT subject | Claim |
|---|---|---|---|
| 访客 | `GET /api/auth/anonymous` | `visitor_<uuid>` | `role=visitor` |
| 客服 | `POST /api/auth/login` | `SysUser.username`（与现有登录 JWT subject 一致） | `role=agent` |

- 握手 Query 参数名：`token`（前后端一致）。
- 签发与校验共用 `common-core` 的 `JwtUtils`（扩展 `role` claim，不另起一套）。
- 拦截器将 `connectionId`（= subject）与 `role` 写入 session attributes。
- 无 token / 无效 → 拒绝握手；日志脱敏，不打印完整 JWT。

### 4.2 客户端 → 服务端

| type | 发送方 | payload | 语义 |
|---|---|---|---|
| `CHAT` | 访客 / 客服 | 访客 `{ text }`；客服 `{ text, visitorId }` | 当前会话态下发消息 |
| `TRANSFER_AGENT` | 访客 | （可空） | 请求转人工 |
| `AGENT_READY` | 客服 | （可空） | 客服上线，写入可分配集合 |
| `AGENT_ACCEPT` | 客服 | `{ visitorId }` | 可选；本轮优先服务端自动分配 |

> 内部帧：`chat-server` 在连接关闭时向 `customer-service` 上行发送 `DISCONNECT`，浏览器不会收到该帧。

### 4.3 服务端 → 客户端

| type | 接收方 | payload | 语义 |
|---|---|---|---|
| `AI_STREAM` | 访客 | `{ text, isDone }` | 累积文本；`isDone=true` 结束 |
| `STATUS_UPDATE` | 访客及对应客服 | `{ status }` | `ai_chat` \| `queuing` \| `agent_chat` |
| `CHAT` | 对端 | `{ text, sender }` | `sender`: `visitor` \| `ai` \| `agent` \| `system` |
| `SESSION_OFFER` | 客服 | `{ visitorId, preview? }` | 待接管/已分配会话通知 |
| `ERROR` | 请求方 | `{ code, message }` | 模型失败等；不伪造答案 |

废弃后端旧 `direct` 帧语义。Vite 开发代理保持 `/ws` → `ws://127.0.0.1:8081`。

### 4.4 转人工简化规则

1. 访客发 `TRANSFER_AGENT` → `STATUS_UPDATE: queuing`。
2. 若存在至少一名已 `AGENT_READY` 的客服 → 立即分配 → 双方 `agent_chat`。
3. 若无客服在线 → 保持 `queuing`，并向访客发 `CHAT` system：「暂无客服在线」（不落离线留言）。
4. 已绑定客服断线 → 访客回退 `queuing` + system 提示（本轮取简单可演示行为）。

## 5. 数据流与 Redis

### 5.1 主路径摘要

1. 访客匿名 JWT → WS 连接。
2. 客服登录 JWT → WS 连接 → `AGENT_READY` → Redis `agents:active`。
3. 访客 `CHAT` → `chat-server` → Redis 事件 → `customer-service` → Feign `/api/ai/ask` → 分片 `AI_STREAM` 回推。
4. 访客 `TRANSFER_AGENT` → 分配在线客服 → 状态与 `SESSION_OFFER` / `STATUS_UPDATE`。
5. 客服 `CHAT` ↔ 访客 `CHAT` 经同一 Pub/Sub 通道转发。

### 5.2 Redis 键（最小集）

| 键 | 用途 |
|---|---|
| `session:state:{visitorId}` | `AI` / `QUEUEING` / `AGENT:{agentId}` |
| `agents:active`（ZSET） | 在线客服；`AGENT_READY` 写入，断线移除 |
| `session:bind:{visitorId}` | 分配后的客服 id |
| Pub/Sub（如 `chat:events`） | `chat-server` ↔ `customer-service` 上下行 |

复用并收紧现有 `RoutingService`：无客服时不强调 `queue:wait` 压力路径。

## 6. 关键改动面

| 区域 | 改动 |
|---|---|
| `JwtUtils` + `JwtWebSocketInterceptor` | `role` claim；attributes 含 connectionId + role |
| `AuthController` / `AuthService` / `SysUser` | 收编未提交认证；匿名/登录 token 带正确 role |
| `ChatWebSocketHandler` | 新帧解析与转发；废 `direct` |
| `customer-service` 编排服务 | CHAT→RAG、TRANSFER、AGENT_READY；推流与状态 |
| `AiRagClient` / `AiRagService` | Feign JSON 契约对齐；**密钥迁出源码到配置/环境变量** |
| 前端 `chatStore`（及客服侧 store） | 连接前拉匿名/登录 token；处理 `ERROR`；客服会话列表 |
| `AgentWorkbench` | 脱离 `SimulationContext`，接真实 WS |
| `VisitorClient` | 离线留言 UI 可保留但标明未接线 |
| 工程债 | 根 `.gitignore`；`git rm --cached` 已跟踪 `target/`；更新 `project-map`（上传入口 = `AiController`） |

实现阶段行为契约变更应走 `openspec/` change（本设计锁定产品范围；计划中列任务）。改 WS 时执行 `.agents/skills/ws-contract-check`。

## 7. 错误处理

| 场景 | 行为 |
|---|---|
| 匿名/登录 HTTP 失败 | 前端提示；不连 WS |
| WS 鉴权失败 | 拒绝握手；前端显示断开，避免无效狂重连 |
| RAG/密钥/模型失败 | `ERROR` + 可选 system `CHAT`；保持 `ai_chat`；不伪造答案 |
| 转人工无客服 | `queuing` + system 提示 |
| 客服断线（已绑定） | 访客回退 `queuing` + system 提示 |
| Redis/依赖不可用 | `ERROR`；日志脱敏 |

## 8. 测试与验收

### 测试

- 后端：帧/角色解析；`RoutingService`（有客服 / 无客服）
- 前端：`chatStore`（token、`AI_STREAM`、`ERROR`、`STATUS_UPDATE`）；客服接单与发消息
- 手工：双浏览器演示脚本（见下）
- 本轮不做完整 E2E 自动化

### 演示验收脚本

1. 浏览器 A：访客开聊 → 提问 → 见真实 `AI_STREAM`（或明确错误）。
2. 浏览器 B：客服登录 → 工作台上线（`AGENT_READY`）。
3. A 转人工 → 双方 `agent_chat` → B 回复 A 可见。
4. 无客服时转人工 → A 停留 `queuing` + system 提示。
5. 确认 `git status` 不再被 `target/` 噪音淹没；`project-map` 已更新文档上传锚点。

## 9. 风险

| 风险 | 缓解 |
|---|---|
| 源码中硬编码模型密钥 | 迁配置/环境变量；禁止再提交密钥 |
| 未提交认证代码与现状不一致 | 以「可登录 + JWT 含 role」为验收，最小收编 |
| WS 端口/代理漂移 | 保持 8081；变更时跑 ws-contract-check |
| `SimulationContext` 残留 | 工作台切真实源后移除引用 |
| 同步 `/ask` + 分片非真流式 | 文档标明；后续可演进为 token 流而不改帧类型 |

## 10. 相关文档

- `AGENTS.md` · ADR-0001 · `brain/00-core/project-map.md`
- `.agents/skills/ws-contract-check` · `.agents/skills/rag-guardrails`
- 既有：`docs/superpowers/specs/2026-07-19-visitor-chat-experience-design.md`
- `openspec/specs/ai-chat` · `agent-routing` · `agent-chat` · `client-auth`
